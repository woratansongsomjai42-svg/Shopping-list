"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PiggyBank, Trash2, TrendingDown, TrendingUp, Wallet } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { AddPersonalTransactionDialog } from "@/components/personal/add-personal-transaction-dialog";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  deletePersonalTransaction,
  getPersonalTransactions,
} from "@/lib/queries/personal-transactions";
import type { PersonalTransaction } from "@/types/models";

function monthLabel(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("th-TH", { year: "numeric", month: "long" });
}

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

export function PersonalLedger({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();

  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["personal-transactions"],
    queryFn: getPersonalTransactions,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePersonalTransaction(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-transactions"] }),
    onError: () => toast.error("ลบไม่สำเร็จ"),
  });

  const currentMonthKey = monthKey(new Date().toISOString());

  const { income, expense } = useMemo(() => {
    return transactions
      .filter((t) => monthKey(t.transaction_date) === currentMonthKey)
      .reduce(
        (totals, t) => {
          totals[t.type] += t.amount;
          return totals;
        },
        { income: 0, expense: 0 },
      );
  }, [transactions, currentMonthKey]);

  const groups = useMemo(() => {
    const byMonth = new Map<string, PersonalTransaction[]>();
    for (const t of transactions) {
      const key = monthKey(t.transaction_date);
      const list = byMonth.get(key) ?? [];
      list.push(t);
      byMonth.set(key, list);
    }
    return [...byMonth.entries()];
  }, [transactions]);

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">การเงินส่วนตัว</h1>
          <p className="text-sm text-muted-foreground">เห็นได้เฉพาะคุณเท่านั้น</p>
        </div>
        <AddPersonalTransactionDialog currentUserId={currentUserId} />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 text-center">
            <TrendingUp className="size-4 text-emerald-600" />
            <p className="text-xs text-muted-foreground">รายรับ</p>
            <p className="text-sm font-semibold text-emerald-600">+{income.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 text-center">
            <TrendingDown className="size-4 text-primary" />
            <p className="text-xs text-muted-foreground">รายจ่าย</p>
            <p className="text-sm font-semibold text-primary">-{expense.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 text-center">
            <Wallet className="size-4 text-secondary" />
            <p className="text-xs text-muted-foreground">คงเหลือ</p>
            <p className="text-sm font-semibold">{(income - expense).toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}

      {!isLoading && transactions.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <PiggyBank className="size-8 text-secondary" />
          <p>ยังไม่มีรายการส่วนตัวเลย กดปุ่ม + เพื่อเริ่มบันทึก</p>
        </div>
      )}

      {groups.map(([month, monthTransactions]) => (
        <section key={month} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {monthLabel(monthTransactions[0].transaction_date)}
          </h2>
          {monthTransactions.map((t) => (
            <div
              key={t.id}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-warm ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-warm-lg"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{t.description}</p>
                <Badge variant="accent" className="mt-1">
                  {t.category}
                </Badge>
              </div>
              <span
                className={
                  t.type === "income"
                    ? "whitespace-nowrap font-semibold text-emerald-600"
                    : "whitespace-nowrap font-semibold text-primary"
                }
              >
                {t.type === "income" ? "+" : "−"}฿{t.amount.toFixed(2)}
              </span>
              <Button
                variant="ghost"
                size="icon"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(t.id)}
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
