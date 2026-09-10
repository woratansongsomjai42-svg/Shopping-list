import { createClient } from "@/lib/supabase/client";
import type { Expense, NewExpense, NewExpenseSplit } from "@/types/models";

export async function getExpenses(householdId: string): Promise<Expense[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("expenses")
    .select("*")
    .eq("household_id", householdId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addExpenseWithSplits(
  expense: NewExpense,
  splits: Omit<NewExpenseSplit, "expense_id">[],
): Promise<void> {
  const supabase = createClient();

  const { data: createdExpense, error: expenseError } = await supabase
    .from("expenses")
    .insert(expense)
    .select()
    .single();
  if (expenseError) throw expenseError;

  const { error: splitsError } = await supabase
    .from("expense_splits")
    .insert(splits.map((split) => ({ ...split, expense_id: createdExpense.id })));
  if (splitsError) {
    await supabase.from("expenses").delete().eq("id", createdExpense.id);
    throw splitsError;
  }
}

export async function deleteExpense(expenseId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("expenses").delete().eq("id", expenseId);
  if (error) throw error;
}

/** Unsettled expense_splits for a household, each tagged with who fronted the money. */
export async function getUnsettledSplits(
  householdId: string,
): Promise<{ user_id: string; share_amount: number; paid_by: string }[]> {
  const supabase = createClient();

  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select("id, paid_by")
    .eq("household_id", householdId);
  if (expensesError) throw expensesError;
  if (expenses.length === 0) return [];

  const paidByMap = new Map(expenses.map((e) => [e.id, e.paid_by]));

  const { data: splits, error: splitsError } = await supabase
    .from("expense_splits")
    .select("user_id, share_amount, expense_id")
    .in(
      "expense_id",
      expenses.map((e) => e.id),
    )
    .eq("is_settled", false);
  if (splitsError) throw splitsError;

  return splits.map((s) => ({
    user_id: s.user_id,
    share_amount: s.share_amount,
    paid_by: paidByMap.get(s.expense_id)!,
  }));
}

/** Marks every unsettled split that `fromUserId` owes `toUserId` (within this household) as settled. */
export async function markSettled(
  householdId: string,
  fromUserId: string,
  toUserId: string,
): Promise<void> {
  const supabase = createClient();

  const { data: expenses, error: expensesError } = await supabase
    .from("expenses")
    .select("id")
    .eq("household_id", householdId)
    .eq("paid_by", toUserId);
  if (expensesError) throw expensesError;
  if (expenses.length === 0) return;

  const { error } = await supabase
    .from("expense_splits")
    .update({ is_settled: true, settled_at: new Date().toISOString() })
    .in(
      "expense_id",
      expenses.map((e) => e.id),
    )
    .eq("user_id", fromUserId)
    .eq("is_settled", false);
  if (error) throw error;
}
