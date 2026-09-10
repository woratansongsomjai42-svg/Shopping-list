"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateDisplayName } from "@/lib/queries/profile";

export function EditDisplayName({
  currentUserId,
  initialName,
}: {
  currentUserId: string;
  initialName: string;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(initialName);

  const mutation = useMutation({
    mutationFn: () => updateDisplayName(currentUserId, name.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      toast.success("บันทึกชื่อแล้ว");
    },
    onError: () => toast.error("บันทึกไม่สำเร็จ"),
  });

  const changed = name.trim() && name.trim() !== initialName;

  return (
    <div className="flex items-center gap-2">
      <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ชื่อที่แสดง" />
      {changed && (
        <Button size="sm" onClick={() => mutation.mutate()} disabled={mutation.isPending}>
          {mutation.isPending ? "กำลังบันทึก..." : "บันทึก"}
        </Button>
      )}
    </div>
  );
}
