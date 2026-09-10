"use client";

import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays,
  ClipboardList,
  PiggyBank,
  Receipt,
  Settings,
  TrendingUp,
  User,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { PersonalDashboard, SharedDashboard } from "@/components/dashboard/dashboard";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getExpenses } from "@/lib/queries/expenses";
import { getPersonalAssets } from "@/lib/queries/personal-assets";
import { getPersonalTransactions } from "@/lib/queries/personal-transactions";

const QUICK_LINKS = [
  { href: "/shopping", label: "ของที่ต้องซื้อ", icon: ClipboardList, tint: "bg-accent text-secondary" },
  { href: "/expenses", label: "ส่วนกลาง", icon: Receipt, tint: "bg-primary/15 text-primary" },
  { href: "/personal", label: "ส่วนตัว", icon: PiggyBank, tint: "bg-secondary/20 text-secondary" },
  { href: "/calendar", label: "ปฏิทิน", icon: CalendarDays, tint: "bg-emerald-500/15 text-emerald-600" },
] as const;

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

export function HomeView({ householdId }: { householdId: string }) {
  const [view, setView] = useState<"shared" | "personal">("shared");
  const currentMonthKey = monthKey(new Date().toISOString());

  const { data: expenses = [] } = useQuery({
    queryKey: ["expenses", householdId],
    queryFn: () => getExpenses(householdId),
  });
  const { data: transactions = [] } = useQuery({
    queryKey: ["personal-transactions"],
    queryFn: getPersonalTransactions,
  });
  const { data: assets = [] } = useQuery({
    queryKey: ["personal-assets"],
    queryFn: getPersonalAssets,
  });

  const householdMonthTotal = useMemo(
    () =>
      expenses
        .filter((e) => monthKey(e.expense_date) === currentMonthKey)
        .reduce((sum, e) => sum + e.amount, 0),
    [expenses, currentMonthKey],
  );

  const personalBalance = useMemo(
    () =>
      transactions
        .filter((t) => monthKey(t.transaction_date) === currentMonthKey)
        .reduce((sum, t) => sum + (t.type === "income" ? t.amount : -t.amount), 0),
    [transactions, currentMonthKey],
  );

  const totalAssets = useMemo(
    () => assets.reduce((sum, a) => sum + a.current_value, 0),
    [assets],
  );

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">หน้าแรก</h1>
        <div className="flex items-center gap-1">
          <Link href="/settings">
            <Button variant="ghost" size="icon" title="ตั้งค่าบ้าน">
              <Settings className="size-4" />
            </Button>
          </Link>
          <Link href="/profile">
            <Button variant="ghost" size="icon" title="โปรไฟล์">
              <User className="size-4" />
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        {QUICK_LINKS.map(({ href, label, icon: Icon, tint }) => (
          <Link
            key={href}
            href={href}
            className="flex flex-col items-center gap-1.5 rounded-2xl bg-card p-2 text-center shadow-warm ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-warm-lg"
          >
            <div className={`flex size-10 items-center justify-center rounded-full ${tint}`}>
              <Icon className="size-5" />
            </div>
            <span className="text-[0.7rem] leading-tight text-muted-foreground">{label}</span>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 text-center">
            <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Receipt className="size-4" />
            </div>
            <p className="text-xs text-muted-foreground">รายจ่ายบ้าน</p>
            <p className="text-sm font-semibold text-primary">฿{householdMonthTotal.toFixed(0)}</p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 text-center">
            <div className="flex size-8 items-center justify-center rounded-full bg-secondary/20 text-secondary">
              <Wallet className="size-4" />
            </div>
            <p className="text-xs text-muted-foreground">คงเหลือส่วนตัว</p>
            <p
              className={`text-sm font-semibold ${personalBalance >= 0 ? "text-emerald-600" : "text-destructive"}`}
            >
              ฿{personalBalance.toFixed(0)}
            </p>
          </CardContent>
        </Card>
        <Card size="sm">
          <CardContent className="flex flex-col items-center gap-1 text-center">
            <div className="flex size-8 items-center justify-center rounded-full bg-accent text-secondary">
              <TrendingUp className="size-4" />
            </div>
            <p className="text-xs text-muted-foreground">ทรัพย์สินรวม</p>
            <p className="text-sm font-semibold">฿{totalAssets.toFixed(0)}</p>
          </CardContent>
        </Card>
      </div>

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
