"use client";

import { useMutation } from "@tanstack/react-query";
import { Pencil } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { updateHouseholdName } from "@/lib/queries/household";

export function EditHouseholdNameDialog({
  householdId,
  currentName,
}: {
  householdId: string;
  currentName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentName);

  const mutation = useMutation({
    mutationFn: () => updateHouseholdName(householdId, name.trim()),
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
    onError: () => toast.error("แก้ไขชื่อบ้านไม่สำเร็จ"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setName(currentName);
      }}
    >
      <DialogTrigger render={<Button variant="ghost" size="icon" />} title="แก้ไขชื่อบ้าน">
        <Pencil className="size-4" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>แก้ไขชื่อบ้าน</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="household-name">ชื่อบ้าน</Label>
          <Input
            id="household-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={!name.trim() || mutation.isPending}>
            {mutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
