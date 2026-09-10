"use client";

import { CalendarDays, ClipboardList, Home, PiggyBank, Receipt } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "หน้าแรก", icon: Home },
  { href: "/shopping", label: "ของที่ต้องซื้อ", icon: ClipboardList },
  { href: "/expenses", label: "ส่วนกลาง", icon: Receipt },
  { href: "/personal", label: "ส่วนตัว", icon: PiggyBank },
  { href: "/calendar", label: "ปฏิทิน", icon: CalendarDays },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-lg items-center justify-around">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground hover:text-foreground",
              )}
            >
              <Icon className={cn("size-5 transition-transform", active && "scale-110")} />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
