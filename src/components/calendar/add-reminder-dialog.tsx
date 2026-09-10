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
import { addReminder } from "@/lib/queries/reminders";

export function AddReminderDialog({
  householdId,
  currentUserId,
  selectedDate,
}: {
  householdId: string;
  currentUserId: string;
  selectedDate: string;
}) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [dueDate, setDueDate] = useState(selectedDate);
  const [dueTime, setDueTime] = useState("");

  const mutation = useMutation({
    mutationFn: () =>
      addReminder({
        household_id: householdId,
        title,
        note: note.trim() || null,
        due_date: dueDate,
        due_time: dueTime || null,
        created_by: currentUserId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders", householdId] });
      toast.success("เพิ่มรายการเตือนความจำแล้ว");
      setOpen(false);
      setTitle("");
      setNote("");
      setDueTime("");
    },
    onError: () => toast.error("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"),
  });

  const canSubmit = title.trim() && dueDate && !mutation.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setDueDate(selectedDate);
      }}
    >
      <DialogTrigger render={<Button size="icon" className="rounded-full" />}>
        <Plus className="size-5" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>เพิ่มเตือนความจำ</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reminder-title">หัวข้อ</Label>
            <Input
              id="reminder-title"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="เช่น จ่ายค่าน้ำค่าไฟ"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="reminder-date">วันที่</Label>
              <Input
                id="reminder-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reminder-time">เวลา (ไม่บังคับ)</Label>
              <Input
                id="reminder-time"
                type="time"
                value={dueTime}
                onChange={(e) => setDueTime(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reminder-note">โน้ต (ไม่บังคับ)</Label>
            <Input
              id="reminder-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="รายละเอียดเพิ่มเติม"
            />
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
