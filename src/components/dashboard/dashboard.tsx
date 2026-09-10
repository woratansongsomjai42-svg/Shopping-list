"use client";

import { useQuery } from "@tanstack/react-query";
import { Wallet } from "lucide-react";
import { useMemo, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  EXPENSE_CATEGORY_COLORS,
  EXPENSE_COLOR,
  INCOME_COLOR,
  PERSONAL_EXPENSE_CATEGORY_COLORS,
  SEQUENTIAL_BLUE,
} from "@/lib/chart-colors";
import { getExpenses } from "@/lib/queries/expenses";
import { getPersonalTransactions } from "@/lib/queries/personal-transactions";
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

function lastSixMonthKeys() {
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
  }
  return months;
}

function SharedDashboard({ householdId }: { householdId: string }) {
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
    return lastSixMonthKeys().map((key) => ({
      month: monthShortLabel(key),
      total: totals.get(key) ?? 0,
    }));
  }, [expenses]);

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">กำลังโหลด...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-secondary">
            <Wallet className="size-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-muted-foreground">รวมเดือนนี้</p>
            <p className="text-3xl font-semibold text-primary">฿{currentMonthTotal.toFixed(2)}</p>
          </div>
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
    </div>
  );
}

function PersonalDashboard() {
  const { data: transactions = [], isLoading } = useQuery({
    queryKey: ["personal-transactions"],
    queryFn: getPersonalTransactions,
  });

  const currentMonthKey = monthKey(new Date().toISOString());

  const currentMonthTransactions = useMemo(
    () => transactions.filter((t) => monthKey(t.transaction_date) === currentMonthKey),
    [transactions, currentMonthKey],
  );

  const { income, expense } = useMemo(
    () =>
      currentMonthTransactions.reduce(
        (totals, t) => {
          totals[t.type] += t.amount;
          return totals;
        },
        { income: 0, expense: 0 },
      ),
    [currentMonthTransactions],
  );

  const categoryData = useMemo(() => {
    const totals = new Map<string, number>();
    for (const t of currentMonthTransactions) {
      if (t.type !== "expense") continue;
      totals.set(t.category, (totals.get(t.category) ?? 0) + t.amount);
    }
    return [...totals.entries()].map(([category, value]) => ({ category, name: category, value }));
  }, [currentMonthTransactions]);

  const monthlyData = useMemo(() => {
    const incomeTotals = new Map<string, number>();
    const expenseTotals = new Map<string, number>();
    for (const t of transactions) {
      const key = monthKey(t.transaction_date);
      const totals = t.type === "income" ? incomeTotals : expenseTotals;
      totals.set(key, (totals.get(key) ?? 0) + t.amount);
    }
    return lastSixMonthKeys().map((key) => ({
      month: monthShortLabel(key),
      รายรับ: incomeTotals.get(key) ?? 0,
      รายจ่าย: expenseTotals.get(key) ?? 0,
    }));
  }, [transactions]);

  if (isLoading) {
    return <p className="p-4 text-sm text-muted-foreground">กำลังโหลด...</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-2">
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 text-center">
            <p className="text-xs text-muted-foreground">รายรับ</p>
            <p className="text-lg font-semibold text-emerald-600">+{income.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 text-center">
            <p className="text-xs text-muted-foreground">รายจ่าย</p>
            <p className="text-lg font-semibold text-primary">-{expense.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 text-center">
            <p className="text-xs text-muted-foreground">คงเหลือ</p>
            <p className="text-lg font-semibold">{(income - expense).toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">
            รายจ่ายแยกตามหมวดหมู่ (เดือนนี้)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {categoryData.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              ยังไม่มีรายจ่ายส่วนตัวเดือนนี้
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
                      <Cell
                        key={entry.category}
                        fill={PERSONAL_EXPENSE_CATEGORY_COLORS[entry.category] ?? EXPENSE_COLOR}
                      />
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
            รายรับ-รายจ่ายย้อนหลัง 6 เดือน
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
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar dataKey="รายรับ" fill={INCOME_COLOR} radius={[4, 4, 0, 0]} />
                <Bar dataKey="รายจ่าย" fill={EXPENSE_COLOR} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function Dashboard({ householdId }: { householdId: string }) {
  const [view, setView] = useState<"shared" | "personal">("shared");

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-24">
      <h1 className="text-xl font-semibold">สรุป</h1>

      <Tabs value={view} onValueChange={(v) => v && setView(v as "shared" | "personal")}>
        <TabsList className="w-full">
          <TabsTrigger value="shared" className="flex-1">
            ส่วนกลาง
          </TabsTrigger>
          <TabsTrigger value="personal" className="flex-1">
            ส่วนตัว
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {view === "shared" ? (
        <SharedDashboard householdId={householdId} />
      ) : (
        <PersonalDashboard />
      )}

      <BottomNav />
    </div>
  );
}
