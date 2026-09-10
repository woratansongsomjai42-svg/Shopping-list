"use client";

import { useQuery } from "@tanstack/react-query";
import { Settings } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { AddItemDialog } from "@/components/shopping/add-item-dialog";
import { LogoutButton } from "@/components/auth/logout-button";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Button } from "@/components/ui/button";
import { ConvertToExpenseDialog } from "@/components/shopping/convert-to-expense-dialog";
import { ShoppingItemRow } from "@/components/shopping/shopping-item-row";
import { useShoppingRealtime } from "@/hooks/use-shopping-realtime";
import { getShoppingItems } from "@/lib/queries/shopping-items";
import { SHOPPING_CATEGORY_LABELS, type ShoppingItem } from "@/types/models";

export function ShoppingList({
  householdId,
  currentUserId,
}: {
  householdId: string;
  currentUserId: string;
}) {
  const [convertTarget, setConvertTarget] = useState<ShoppingItem | null>(null);

  useShoppingRealtime(householdId);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["shopping-items", householdId],
    queryFn: () => getShoppingItems(householdId),
  });

  const groups = useMemo(() => {
    const byCategory = new Map<ShoppingItem["category"], ShoppingItem[]>();
    for (const item of items) {
      const list = byCategory.get(item.category) ?? [];
      list.push(item);
      byCategory.set(item.category, list);
    }
    return [...byCategory.entries()];
  }, [items]);

  const remainingCount = items.filter((i) => !i.is_purchased).length;

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold">รายการของที่ต้องซื้อ</h1>
          <p className="text-sm text-muted-foreground">เหลือ {remainingCount} รายการ</p>
        </div>
        <div className="flex items-center gap-1">
          <AddItemDialog householdId={householdId} currentUserId={currentUserId} />
          <Link href="/settings">
            <Button variant="ghost" size="icon" title="ตั้งค่าบ้าน">
              <Settings className="size-4" />
            </Button>
          </Link>
          <LogoutButton />
        </div>
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}

      {!isLoading && items.length === 0 && (
        <p className="py-12 text-center text-sm text-muted-foreground">
          ยังไม่มีของที่ต้องซื้อ กดปุ่ม + เพื่อเพิ่มรายการ
        </p>
      )}

      {groups.map(([category, categoryItems]) => (
        <section key={category} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">
            {SHOPPING_CATEGORY_LABELS[category]}
          </h2>
          {categoryItems.map((item) => (
            <ShoppingItemRow
              key={item.id}
              item={item}
              currentUserId={currentUserId}
              onRequestConvert={setConvertTarget}
            />
          ))}
        </section>
      ))}

      {convertTarget && (
        <ConvertToExpenseDialog
          item={convertTarget}
          currentUserId={currentUserId}
          open={!!convertTarget}
          onOpenChange={(open) => !open && setConvertTarget(null)}
        />
      )}

      <BottomNav />
    </div>
  );
}
