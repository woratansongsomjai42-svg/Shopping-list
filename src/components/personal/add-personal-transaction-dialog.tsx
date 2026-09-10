"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { addPersonalTransaction } from "@/lib/queries/personal-transactions";
import {
  PERSONAL_EXPENSE_CATEGORIES,
  PERSONAL_INCOME_CATEGORIES,
  PERSONAL_TRANSACTION_TYPE_LABELS,
  type PersonalTransactionType,
} from "@/types/models";

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export function AddPersonalTransactionDialog({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<PersonalTransactionType>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(PERSONAL_EXPENSE_CATEGORIES[0]);
  const [date, setDate] = useState(todayISO());

  const categoryOptions = type === "income" ? PERSONAL_INCOME_CATEGORIES : PERSONAL_EXPENSE_CATEGORIES;

  const mutation = useMutation({
    mutationFn: () =>
      addPersonalTransaction({
        user_id: currentUserId,
        type,
        category,
        description,
        amount: Number(amount),
        transaction_date: date,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-transactions"] });
      toast.success("บันทึกแล้ว");
      setOpen(false);
      setDescription("");
      setAmount("");
      setDate(todayISO());
    },
    onError: () => toast.error("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"),
  });

  function changeType(next: PersonalTransactionType) {
    setType(next);
    setCategory(next === "income" ? PERSONAL_INCOME_CATEGORIES[0] : PERSONAL_EXPENSE_CATEGORIES[0]);
  }

  const canSubmit = description.trim() && Number(amount) > 0 && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" className="rounded-full" />}>
        <Plus className="size-5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>บันทึกรายรับ-รายจ่ายส่วนตัว</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <Tabs value={type} onValueChange={(v) => v && changeType(v as PersonalTransactionType)}>
            <TabsList className="w-full">
              <TabsTrigger value="expense" className="flex-1">
                {PERSONAL_TRANSACTION_TYPE_LABELS.expense}
              </TabsTrigger>
              <TabsTrigger value="income" className="flex-1">
                {PERSONAL_TRANSACTION_TYPE_LABELS.income}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-2">
            <Label htmlFor="personal-description">รายการ</Label>
            <Input
              id="personal-description"
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === "income" ? "เช่น เงินเดือนเดือนนี้" : "เช่น ค่ากาแฟ"}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="personal-amount">จำนวนเงิน (บาท)</Label>
              <Input
                id="personal-amount"
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
              <Label htmlFor="personal-date">วันที่</Label>
              <Input
                id="personal-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>หมวดหมู่</Label>
            <Select
              items={categoryOptions.map((option) => ({ label: option, value: option }))}
              value={category}
              onValueChange={(v) => v && setCategory(v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categoryOptions.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!canSubmit}>
            {mutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
