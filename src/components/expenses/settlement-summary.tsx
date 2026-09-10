"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getHouseholdMembers } from "@/lib/queries/household";
import { getUnsettledSplits, markSettled } from "@/lib/queries/expenses";
import { computeNetBalances, simplifyDebts } from "@/lib/settlement";

export function SettlementSummary({
  householdId,
  currentUserId,
}: {
  householdId: string;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();

  const { data: splits = [], isLoading } = useQuery({
    queryKey: ["unsettled-splits", householdId],
    queryFn: () => getUnsettledSplits(householdId),
  });

  const { data: members = [] } = useQuery({
    queryKey: ["household-members", householdId],
    queryFn: () => getHouseholdMembers(householdId),
  });

  const balances = useMemo(() => simplifyDebts(computeNetBalances(splits)), [splits]);

  const settleMutation = useMutation({
    mutationFn: ({ fromUserId, toUserId }: { fromUserId: string; toUserId: string }) =>
      markSettled(householdId, fromUserId, toUserId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["unsettled-splits", householdId] });
      toast.success("บันทึกการชำระเงินแล้ว");
    },
    onError: () => toast.error("บันทึกไม่สำเร็จ"),
  });

  function nameOf(userId: string) {
    const member = members.find((m) => m.user_id === userId);
    if (!member) return "สมาชิก";
    if (userId === currentUserId) return "คุณ";
    return member.display_name ?? "สมาชิก";
  }

  if (isLoading) return null;
  if (balances.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-3 text-sm text-muted-foreground">
        ทุกคนเคลียร์หนี้กันหมดแล้ว
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">สรุปยอดหนี้</h2>
      {balances.map((balance) => (
        <div
          key={`${balance.fromUserId}-${balance.toUserId}`}
          className="flex items-center gap-2 rounded-lg border bg-card p-3"
        >
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
            <span className="truncate font-medium">{nameOf(balance.fromUserId)}</span>
            <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
            <span className="truncate font-medium">{nameOf(balance.toUserId)}</span>
          </div>
          <span className="whitespace-nowrap font-semibold">฿{balance.amount.toFixed(2)}</span>
          <Button
            size="sm"
            variant="secondary"
            disabled={settleMutation.isPending}
            onClick={() =>
              settleMutation.mutate({ fromUserId: balance.fromUserId, toUserId: balance.toUserId })
            }
          >
            ชำระแล้ว
          </Button>
        </div>
      ))}
    </div>
  );
}
