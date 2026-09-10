"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import { useState } from "react";
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
import { addShoppingItem } from "@/lib/queries/shopping-items";
import {
  SHOPPING_CATEGORY_LABELS,
  URGENCY_LABELS,
  type ShoppingCategory,
  type UrgencyLevel,
} from "@/types/models";

export function AddItemDialog({
  householdId,
  currentUserId,
}: {
  householdId: string;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [unit, setUnit] = useState("ชิ้น");
  const [category, setCategory] = useState<ShoppingCategory>("other");
  const [urgency, setUrgency] = useState<UrgencyLevel>("normal");

  const mutation = useMutation({
    mutationFn: () =>
      addShoppingItem({
        household_id: householdId,
        name,
        quantity: Number(quantity) || 1,
        unit,
        category,
        urgency,
        created_by: currentUserId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shopping-items", householdId] });
      setOpen(false);
      setName("");
      setQuantity("1");
      setUrgency("normal");
    },
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" className="rounded-full" />}>
        <Plus className="size-5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มของที่ต้องซื้อ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="item-name">ชื่อสินค้า</Label>
            <Input
              id="item-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น นมสด, น้ำยาล้างจาน"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="item-quantity">จำนวน</Label>
              <Input
                id="item-quantity"
                type="number"
                min="0"
                step="0.5"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-unit">หน่วย</Label>
              <Input id="item-unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
            </div>
          </div>

          <div className="space-y-2">
            <Label>หมวดหมู่</Label>
            <Select
              items={SHOPPING_CATEGORY_LABELS}
              value={category}
              onValueChange={(v) => setCategory(v as ShoppingCategory)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(SHOPPING_CATEGORY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>ความจำเป็น</Label>
            <Select
              items={URGENCY_LABELS}
              value={urgency}
              onValueChange={(v) => setUrgency(v as UrgencyLevel)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(URGENCY_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
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
          <Button
            onClick={() => mutation.mutate()}
            disabled={!name.trim() || mutation.isPending}
          >
            {mutation.isPending ? "กำลังเพิ่ม..." : "เพิ่มรายการ"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
