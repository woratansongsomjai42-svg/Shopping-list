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
import { addPersonalAsset } from "@/lib/queries/personal-assets";
import { PERSONAL_ASSET_TYPE_LABELS, type PersonalAssetType } from "@/types/models";

export function AddAssetDialog({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<PersonalAssetType>("savings");
  const [investedAmount, setInvestedAmount] = useState("");
  const [currentValue, setCurrentValue] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      addPersonalAsset({
        user_id: currentUserId,
        name,
        type,
        invested_amount: Number(investedAmount) || 0,
        current_value: Number(currentValue) || 0,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-assets"] });
      toast.success("เพิ่มทรัพย์สินแล้ว");
      setOpen(false);
      setName("");
      setInvestedAmount("");
      setCurrentValue("");
    },
    onError: () => toast.error("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"),
  });

  const canSubmit = name.trim() && Number(currentValue) > 0 && !mutation.isPending;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="icon" className="rounded-full" />}>
        <Plus className="size-5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มทรัพย์สิน</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="asset-name">ชื่อทรัพย์สิน</Label>
            <Input
              id="asset-name"
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="เช่น กองทุน SET50, บัญชีออมทรัพย์"
            />
          </div>

          <div className="space-y-2">
            <Label>ประเภท</Label>
            <Select
              items={PERSONAL_ASSET_TYPE_LABELS}
              value={type}
              onValueChange={(v) => v && setType(v as PersonalAssetType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PERSONAL_ASSET_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="asset-invested">เงินลงทุน (บาท)</Label>
              <Input
                id="asset-invested"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={investedAmount}
                onChange={(e) => setInvestedAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="asset-current">มูลค่าปัจจุบัน (บาท)</Label>
              <Input
                id="asset-current"
                type="number"
                inputMode="decimal"
                min="0"
                step="0.01"
                value={currentValue}
                onChange={(e) => setCurrentValue(e.target.value)}
                placeholder="0.00"
              />
            </div>
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
