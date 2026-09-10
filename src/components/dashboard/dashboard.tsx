"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EXPENSE_CATEGORY_COLORS, SEQUENTIAL_BLUE } from "@/lib/chart-colors";
import { getExpenses } from "@/lib/queries/expenses";
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/types/models";

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

function monthShortLabel(key: string) {
  const [year, month] = key.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString("th-TH", {
    month: "short",
    year: "2-digit",
  });
}

export function Dashboard({ householdId }: { householdId: string }) {
  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["expenses", householdId],
    queryFn: () => getExpenses(householdId),
  });

  const currentMonthKey = monthKey(new Date().toISOString());

  const currentMonthExpenses = useMemo(
    () => expenses.filter((e) => monthKey(e.expense_date) === currentMonthKey),
    [expenses, currentMonthKey],
  );

  const currentMonthTotal = useMemo(
    () => currentMonthExpenses.reduce((sum, e) => sum + e.amount, 0),
    [currentMonthExpenses],
  );

  const categoryData = useMemo(() => {
    const totals = new Map<ExpenseCategory, number>();
    for (const e of currentMonthExpenses) {
      totals.set(e.category, (totals.get(e.category) ?? 0) + e.amount);
    }
    return (Object.keys(EXPENSE_CATEGORY_LABELS) as ExpenseCategory[])
      .filter((category) => totals.has(category))
      .map((category) => ({
        category,
        name: EXPENSE_CATEGORY_LABELS[category],
        value: totals.get(category)!,
      }));
  }, [currentMonthExpenses]);

  const monthlyData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const e of expenses) {
      const key = monthKey(e.expense_date);
      totals.set(key, (totals.get(key) ?? 0) + e.amount);
    }
    const now = new Date();
    const months: string[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return months.map((key) => ({ month: monthShortLabel(key), total: totals.get(key) ?? 0 }));
  }, [expenses]);

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">กำลังโหลด...</p>;
  }

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-24">
      <h1 className="text-xl font-semibold">สรุปรายจ่าย</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">รวมเดือนนี้</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-semibold">฿{currentMonthTotal.toFixed(2)}</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            แยกตามหมวดหมู่ (เดือนนี้)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีรายจ่ายเดือนนี้
            </p>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius="55%"
                    outerRadius="80%"
                    paddingAngle={2}
                    stroke="var(--card)"
                    strokeWidth={2}
                  >
                    {categoryData.map((entry) => (
                      <Cell key={entry.category} fill={EXPENSE_CATEGORY_COLORS[entry.category]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `฿${Number(value).toFixed(2)}`} />
                  <Legend wrapperStyle={{ fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            เปรียบเทียบย้อนหลัง 6 เดือน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData}>
                <CartesianGrid vertical={false} stroke="var(--border)" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <YAxis hide />
                <Tooltip
                  formatter={(value) => `฿${Number(value).toFixed(2)}`}
                  cursor={{ fill: "var(--muted)" }}
                />
                <Bar dataKey="total" fill={SEQUENTIAL_BLUE} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <BottomNav />
    </div>
  );
}
