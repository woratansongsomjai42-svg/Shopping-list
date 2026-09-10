"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { getHouseholdMembers } from "@/lib/queries/household";
import { convertItemToExpense } from "@/lib/queries/shopping-items";
import {
  EXPENSE_CATEGORY_LABELS,
  SHOPPING_TO_EXPENSE_CATEGORY,
  type ExpenseCategory,
  type ShoppingItem,
} from "@/types/models";

export function ConvertToExpenseDialog({
  item,
  currentUserId,
  open,
  onOpenChange,
}: {
  item: ShoppingItem;
  currentUserId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>(
    SHOPPING_TO_EXPENSE_CATEGORY[item.category],
  );
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitWith, setSplitWith] = useState<Set<string>>(new Set([currentUserId]));

  const { data: members = [] } = useQuery({
    queryKey: ["household-members", item.household_id],
    queryFn: () => getHouseholdMembers(item.household_id),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const amountValue = Number(amount);
      const participants = members.filter((m) => splitWith.has(m.user_id));
      const shareAmount = Math.round((amountValue / participants.length) * 100) / 100;

      await convertItemToExpense({
        item,
        expense: {
          household_id: item.household_id,
          description: item.name,
          amount: amountValue,
          category,
          paid_by: paidBy,
          created_by: currentUserId,
        },
        splits: participants.map((m) => ({ user_id: m.user_id, share_amount: shareAmount })),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items", item.household_id] });
      toast.success(`บันทึกรายจ่าย "${item.name}" แล้ว`);
      onOpenChange(false);
    },
    onError: () => toast.error("บันทึกรายจ่ายไม่สำเร็จ ลองใหม่อีกครั้ง"),
  });

  function toggleParticipant(userId: string) {
    setSplitWith((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  const amountValue = Number(amount);
  const canSubmit = amountValue > 0 && splitWith.size > 0 && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>แปลง &ldquo;{item.name}&rdquo; เป็นรายจ่าย</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">จำนวนเงิน (บาท)</Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              autoFocus
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label>หมวดหมู่รายจ่าย</Label>
            <Select
              items={EXPENSE_CATEGORY_LABELS}
              value={category}
              onValueChange={(v) => setCategory(v as ExpenseCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ใครเป็นคนจ่าย</Label>
            <Select value={paidBy} onValueChange={(v) => v && setPaidBy(v)}>
              <SelectTrigger>
                <SelectValue>
                  {(value: string | null) => {
                    const member = members.find((m) => m.user_id === value);
                    if (!member) return "";
                    return member.display_name ?? (member.user_id === currentUserId ? "คุณ" : "สมาชิก");
                  }}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.user_id} value={m.user_id}>
                    {m.display_name ?? m.user_id}
                    {m.user_id === currentUserId ? " (คุณ)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>หารกับใครบ้าง</Label>
            <div className="space-y-2 rounded-md border p-3">
              {members.map((m) => (
                <label key={m.user_id} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={splitWith.has(m.user_id)}
                    onCheckedChange={() => toggleParticipant(m.user_id)}
                  />
                  {m.display_name ?? m.user_id}
                  {m.user_id === currentUserId ? " (คุณ)" : ""}
                </label>
              ))}
            </div>
            {splitWith.size > 0 && amountValue > 0 && (
              <p className="text-xs text-muted-foreground">
                คนละ {(amountValue / splitWith.size).toFixed(2)} บาท
              </p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
            {mutation.isPending ? "กำลังบันทึก..." : "บันทึกรายจ่าย"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
