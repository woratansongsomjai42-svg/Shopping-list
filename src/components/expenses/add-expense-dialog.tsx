"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { getHouseholdMembers } from "@/lib/queries/household";
import { addExpenseWithSplits } from "@/lib/queries/expenses";
import { EXPENSE_CATEGORY_LABELS, type ExpenseCategory } from "@/types/models";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function AddExpenseDialog({
  householdId,
  currentUserId,
}: {
  householdId: string;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [expenseDate, setExpenseDate] = useState(todayISO());
  const [paidBy, setPaidBy] = useState(currentUserId);
  const [splitWith, setSplitWith] = useState<Set<string>>(new Set([currentUserId]));

  const { data: members = [] } = useQuery({
    queryKey: ["household-members", householdId],
    queryFn: () => getHouseholdMembers(householdId),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const amountValue = Number(amount);
      const participants = members.filter((m) => splitWith.has(m.user_id));
      const shareAmount = Math.round((amountValue / participants.length) * 100) / 100;

      await addExpenseWithSplits(
        {
          household_id: householdId,
          description,
          amount: amountValue,
          category,
          expense_date: expenseDate,
          paid_by: paidBy,
          created_by: currentUserId,
        },
        participants.map((m) => ({ user_id: m.user_id, share_amount: shareAmount })),
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["expenses", householdId] });
      toast.success("บันทึกรายจ่ายแล้ว");
      setOpen(false);
      setDescription("");
      setAmount("");
      setCategory("other");
      setExpenseDate(todayISO());
      setSplitWith(new Set([currentUserId]));
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
  const canSubmit =
    description.trim() && amountValue > 0 && splitWith.size > 0 && !mutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setPaidBy(currentUserId);
      }}
    >
      <DialogTrigger render={<Button size="icon" className="rounded-full" />}>
        <Plus className="size-5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>บันทึกรายจ่าย</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="expense-description">รายการ</Label>
            <Input
              id="expense-description"
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="เช่น ค่าไฟเดือนนี้"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="expense-amount">จำนวนเงิน (บาท)</Label>
              <Input
                id="expense-amount"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expense-date">วันที่</Label>
              <Input
                id="expense-date"
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>หมวดหมู่</Label>
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
                    return (
                      member.display_name ??
                      (member.user_id === currentUserId ? "คุณ" : "สมาชิก")
                    );
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
          <Button variant="outline" onClick={() => setOpen(false)}>
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
