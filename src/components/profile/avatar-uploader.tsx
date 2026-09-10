"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Camera } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { uploadAvatar } from "@/lib/queries/profile";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function AvatarUploader({
  currentUserId,
  displayName,
  avatarUrl,
}: {
  currentUserId: string;
  displayName: string | null;
  avatarUrl: string | null;
}) {
  const queryClient = useQueryClient();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(avatarUrl);

  const mutation = useMutation({
    mutationFn: (file: File) => uploadAvatar(currentUserId, file),
    onSuccess: (url) => {
      setPreview(url);
      queryClient.invalidateQueries({ queryKey: ["household-members"] });
      toast.success("อัปเดตรูปโปรไฟล์แล้ว");
    },
    onError: () => toast.error("อัปโหลดรูปไม่สำเร็จ ลองใหม่อีกครั้ง"),
  });

  function handleFile(file: File | undefined) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("เลือกไฟล์รูปภาพเท่านั้น");
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error("ไฟล์รูปต้องไม่เกิน 5MB");
      return;
    }
    mutation.mutate(file);
  }

  const initial = displayName?.trim().charAt(0).toUpperCase() ?? "?";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex size-24 items-center justify-center overflow-hidden rounded-full bg-accent text-2xl font-semibold text-accent-foreground ring-4 ring-card shadow-warm transition-transform hover:scale-105"
        title="เปลี่ยนรูปโปรไฟล์"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="รูปโปรไฟล์" className="size-full object-cover" />
        ) : (
          initial
        )}
      </button>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={mutation.isPending}
        className="absolute -right-1 -bottom-1 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-warm transition-transform hover:scale-110 disabled:opacity-50"
        title="เปลี่ยนรูปโปรไฟล์"
      >
        <Camera className="size-4" />
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
