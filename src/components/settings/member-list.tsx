"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getHouseholdMembers, removeMember, updateMemberRole } from "@/lib/queries/household";
import { MEMBER_ROLE_LABELS, type MemberRole } from "@/types/models";

export function MemberList({
  householdId,
  currentUserId,
  isOwner,
}: {
  householdId: string;
  currentUserId: string;
  isOwner: boolean;
}) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: members = [], isLoading } = useQuery({
    queryKey: ["household-members", householdId],
    queryFn: () => getHouseholdMembers(householdId),
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["household-members", householdId] });

  const roleMutation = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: MemberRole }) =>
      updateMemberRole(householdId, userId, role),
    onSuccess: invalidate,
    onError: () => toast.error("เปลี่ยนบทบาทไม่สำเร็จ"),
  });

  const removeMutation = useMutation({
    mutationFn: (userId: string) => removeMember(householdId, userId),
    onSuccess: (_data, userId) => {
      invalidate();
      if (userId === currentUserId) router.push("/onboarding");
    },
    onError: () => toast.error("ดำเนินการไม่สำเร็จ"),
  });

  const ownerCount = members.filter((m) => m.role === "owner").length;

  if (isLoading) return <p className="text-sm text-muted-foreground">กำลังโหลด...</p>;

  return (
    <div className="space-y-2">
      {members.map((member) => {
        const isSelf = member.user_id === currentUserId;
        const isLastOwner = member.role === "owner" && ownerCount === 1;
        const canRemove = isOwner || isSelf;

        return (
          <div
            key={member.user_id}
            className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-warm ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-warm-lg"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">
                {member.display_name ?? "สมาชิก"}
                {isSelf && " (คุณ)"}
              </p>
            </div>

            {isOwner ? (
              <Select
                items={MEMBER_ROLE_LABELS}
                value={member.role}
                onValueChange={(role) =>
                  role && roleMutation.mutate({ userId: member.user_id, role: role as MemberRole })
                }
                disabled={isLastOwner || roleMutation.isPending}
              >
                <SelectTrigger size="sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(MEMBER_ROLE_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <Badge variant="outline">{MEMBER_ROLE_LABELS[member.role]}</Badge>
            )}

            {canRemove && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                disabled={isLastOwner || removeMutation.isPending}
                onClick={() => removeMutation.mutate(member.user_id)}
                title={isSelf ? "ออกจากบ้าน" : "ลบสมาชิก"}
              >
                {isSelf ? <LogOut className="size-4" /> : <Trash2 className="size-4" />}
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
