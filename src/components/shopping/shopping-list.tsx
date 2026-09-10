"use client";

import { useQuery } from "@tanstack/react-query";
import { ShoppingBasket } from "lucide-react";
import { useMemo, useState } from "react";
import { AddItemDialog } from "@/components/shopping/add-item-dialog";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Badge } from "@/components/ui/badge";
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
          <div className="mt-1 flex items-center gap-1.5">
            <Badge variant="accent">เหลือ {remainingCount}</Badge>
            <span className="text-sm text-muted-foreground">รายการ</span>
          </div>
        </div>
        <AddItemDialog householdId={householdId} currentUserId={currentUserId} />
      </div>

      {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}

      {!isLoading && items.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <ShoppingBasket className="size-8 text-secondary" />
          <p>ยังไม่มีของที่ต้องซื้อ 🧺 กดปุ่ม + เพื่อเพิ่มรายการแรก</p>
        </div>
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
