"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2 } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { AddExpenseDialog } from "@/components/expenses/add-expense-dialog";
import { SettlementSummary } from "@/components/expenses/settlement-summary";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Button } from "@/components/ui/button";
import { getHouseholdMembers } from "@/lib/queries/household";
import { deleteExpense, getExpenses } from "@/lib/queries/expenses";
import { EXPENSE_CATEGORY_LABELS, type Expense } from "@/types/models";

function monthLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", { year: "numeric", month: "long" });
}

export function ExpenseList({
  householdId,
  currentUserId,
}: {
  householdId: string;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", householdId],
    queryFn: () => getExpenses(householdId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["household-members", householdId],
    queryFn: () => getHouseholdMembers(householdId),
  });

  const deleteMutation = useMutation({
    mutationFn: (expenseId: string) => deleteExpense(expenseId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
      queryClient.invalidateQueries({ queryKey: ["unsettled-splits", householdId] });
    },
    onError: () => toast.error("ลบรายจ่ายไม่สำเร็จ"),
  });

  const groups = useMemo(() => {
    const byMonth = new Map<string, Expense[]>();
    for (const expense of expenses) {
      const key = expense.expense_date.slice(0, 7);
      const list = byMonth.get(key) ?? [];
      list.push(expense);
      byMonth.set(key, list);
    }
    return [...byMonth.entries()];
  }, [expenses]);

  function payerName(userId: string) {
    if (userId === currentUserId) return "คุณ";
    return members.find((m) => m.user_id === userId)?.display_name ?? "สมาชิก";
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">รายจ่าย</h1>
        <AddExpenseDialog householdId={householdId} currentUserId={currentUserId} />
      </div>

      <SettlementSummary householdId={householdId} currentUserId={currentUserId} />

      {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}

      {!isLoading && expenses.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          ยังไม่มีรายจ่าย กดปุ่ม + เพื่อบันทึกรายจ่าย
        </p>
      )}

      {groups.map(([month, monthExpenses]) => (
        <section key={month} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {monthLabel(monthExpenses[0].expense_date)}
          </h2>
          {monthExpenses.map((expense) => (
            <div key={expense.id} className="flex items-center gap-3 rounded-lg border bg-card p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{expense.description}</p>
                <p className="text-xs text-muted-foreground">
                  {EXPENSE_CATEGORY_LABELS[expense.category]} · {payerName(expense.paid_by)}จ่าย
                </p>
              </div>
              <span className="whitespace-nowrap font-semibold">
                ฿{expense.amount.toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(expense.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </section>
      ))}

      <BottomNav />
    </div>
  );
}
