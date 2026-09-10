"use client";

import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteHousehold } from "@/lib/queries/household";

export function DeleteHouseholdDialog({
  householdId,
  householdName,
}: {
  householdId: string;
  householdName: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const mutation = useMutation({
    mutationFn: () => deleteHousehold(householdId),
    onSuccess: () => router.push("/onboarding"),
    onError: () => toast.error("ลบบ้านไม่สำเร็จ"),
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setConfirmText("");
      }}
    >
      <DialogTrigger render={<Button variant="destructive" className="w-full" />}>
        ลบบ้านนี้
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ลบบ้าน &ldquo;{householdName}&rdquo;</DialogTitle>
          <DialogDescription>
            การลบบ้านจะลบรายการของ รายจ่าย และสมาชิกทั้งหมดอย่างถาวร กู้คืนไม่ได้
            สมาชิกคนอื่นจะถูกเอาออกจากบ้านนี้ทันที
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label htmlFor="confirm-name">พิมพ์ &ldquo;{householdName}&rdquo; เพื่อยืนยัน</Label>
          <Input
            id="confirm-name"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            autoFocus
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            ยกเลิก
          </Button>
          <Button
            variant="destructive"
            disabled={confirmText !== householdName || mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.isPending ? "กำลังลบ..." : "ลบบ้านถาวร"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
