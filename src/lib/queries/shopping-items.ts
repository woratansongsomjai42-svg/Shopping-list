import { createClient } from "@/lib/supabase/client";
import type { NewExpense, NewExpenseSplit, NewShoppingItem, ShoppingItem } from "@/types/models";

export async function getShoppingItems(householdId: string): Promise<ShoppingItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .select("*")
    .eq("household_id", householdId)
    .order("is_purchased", { ascending: true })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addShoppingItem(item: NewShoppingItem): Promise<ShoppingItem> {
  const supabase = createClient();
  const { data, error } = await supabase.from("shopping_items").insert(item).select().single();

  if (error) throw error;
  return data;
}

export async function setItemPurchased(
  itemId: string,
  purchased: boolean,
  purchasedBy: string,
): Promise<ShoppingItem> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("shopping_items")
    .update({
      is_purchased: purchased,
      purchased_by: purchased ? purchasedBy : null,
      purchased_at: purchased ? new Date().toISOString() : null,
    })
    .eq("id", itemId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteShoppingItem(itemId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("shopping_items").delete().eq("id", itemId);
  if (error) throw error;
}

/**
 * Creates the expense (+ its splits) from a purchased shopping item, then
 * links the item back to it. Not wrapped in a DB transaction — Supabase's
 * JS client has no multi-statement transaction API — so on split failure we
 * roll back the expense insert manually to avoid an orphaned expense.
 */
export async function convertItemToExpense(params: {
  item: ShoppingItem;
  expense: NewExpense;
  splits: Omit<NewExpenseSplit, "expense_id">[];
}): Promise<void> {
  const supabase = createClient();
  const { item, expense, splits } = params;

  const { data: createdExpense, error: expenseError } = await supabase
    .from("expenses")
    .insert({ ...expense, source_item_id: item.id })
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

  const { error: itemError } = await supabase
    .from("shopping_items")
    .update({ converted_expense_id: createdExpense.id })
    .eq("id", item.id);
  if (itemError) throw itemError;
}
