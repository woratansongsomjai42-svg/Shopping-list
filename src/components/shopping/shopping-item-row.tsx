"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Receipt } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { setItemPurchased } from "@/lib/queries/shopping-items";
import { SHOPPING_CATEGORY_LABELS, URGENCY_LABELS, type ShoppingItem } from "@/types/models";
import { cn } from "@/lib/utils";

const URGENCY_STYLES: Record<ShoppingItem["urgency"], string> = {
  urgent: "border-transparent bg-destructive/10 text-destructive",
  normal: "border-transparent",
  backup: "border-transparent bg-muted text-muted-foreground",
};

export function ShoppingItemRow({
  item,
  currentUserId,
  onRequestConvert,
}: {
  item: ShoppingItem;
  currentUserId: string;
  onRequestConvert: (item: ShoppingItem) => void;
}) {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: (purchased: boolean) => setItemPurchased(item.id, purchased, currentUserId),
    onSuccess: (updated) => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items", item.household_id] });
      if (updated.is_purchased && !updated.converted_expense_id) {
        onRequestConvert(updated);
      }
    },
  });

  const needsConversion = item.is_purchased && !item.converted_expense_id;

  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-warm ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-warm-lg">
      <Checkbox
        checked={item.is_purchased}
        disabled={toggleMutation.isPending}
        onCheckedChange={(checked) => toggleMutation.mutate(checked === true)}
      />

      <div className="min-w-0 flex-1">
        <p className={cn("truncate font-medium", item.is_purchased && "text-muted-foreground line-through")}>
          {item.name}
        </p>
        <p className="text-xs text-muted-foreground">
          {item.quantity} {item.unit} · {SHOPPING_CATEGORY_LABELS[item.category]}
        </p>
      </div>

      {item.urgency !== "normal" && (
        <Badge variant="outline" className={URGENCY_STYLES[item.urgency]}>
          {URGENCY_LABELS[item.urgency]}
        </Badge>
      )}

      {item.converted_expense_id ? (
        <Badge variant="secondary" className="gap-1 whitespace-nowrap">
          <Receipt className="size-3" /> บันทึกแล้ว
        </Badge>
      ) : (
        needsConversion && (
          <Button size="sm" variant="secondary" onClick={() => onRequestConvert(item)}>
            แปลงเป็นรายจ่าย
          </Button>
        )
      )}
    </div>
  );
}
