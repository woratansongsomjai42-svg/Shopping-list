"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
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
import { updatePersonalAssetValue } from "@/lib/queries/personal-assets";
import type { PersonalAsset } from "@/types/models";

export function EditAssetValueDialog({ asset }: { asset: PersonalAsset }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(String(asset.current_value));

  const mutation = useMutation({
    mutationFn: () => updatePersonalAssetValue(asset.id, Number(value)),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["personal-assets"] });
      setOpen(false);
    },
    onError: () => toast.error("อัปเดตไม่สำเร็จ"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setValue(String(asset.current_value));
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon" />} title="แก้ไขมูลค่า">
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>อัปเดตมูลค่า &ldquo;{asset.name}&rdquo;</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="asset-value">มูลค่าปัจจุบัน (บาท)</Label>
          <Input
            id="asset-value"
            type="number"
            inputMode="decimal"
            min="0"
            step="0.01"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            onClick={() => mutation.mutate()}
            disabled={!value || Number(value) < 0 || mutation.isPending}
          >
            {mutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
