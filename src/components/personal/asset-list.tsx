"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { PiggyBank, Trash2, TrendingUp } from "lucide-react";
import { useMemo } from "react";
import { toast } from "sonner";
import { AddAssetDialog } from "@/components/personal/add-asset-dialog";
import { EditAssetValueDialog } from "@/components/personal/edit-asset-value-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { deletePersonalAsset, getPersonalAssets } from "@/lib/queries/personal-assets";
import { PERSONAL_ASSET_TYPE_LABELS } from "@/types/models";

export function AssetList({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();

  const { data: assets = [], isLoading } = useQuery({
    queryKey: ["personal-assets"],
    queryFn: getPersonalAssets,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePersonalAsset(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["personal-assets"] }),
    onError: () => toast.error("ลบไม่สำเร็จ"),
  });

  const { totalInvested, totalCurrent } = useMemo(
    () =>
      assets.reduce(
        (totals, a) => {
          totals.totalInvested += a.invested_amount;
          totals.totalCurrent += a.current_value;
          return totals;
        },
        { totalInvested: 0, totalCurrent: 0 },
      ),
    [assets],
  );

  const gain = totalCurrent - totalInvested;
  const gainPercent = totalInvested > 0 ? (gain / totalInvested) * 100 : 0;

  if (isLoading) return <p className="text-sm text-muted-foreground">กำลังโหลด...</p>;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">มูลค่าพอร์ตรวม</p>
        <AddAssetDialog currentUserId={currentUserId} />
      </div>

      <Card>
        <CardContent className="flex items-center gap-3">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-accent text-secondary">
            <TrendingUp className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-3xl font-semibold text-primary">฿{totalCurrent.toLocaleString()}</p>
            {totalInvested > 0 && (
              <p className={gain >= 0 ? "text-sm text-emerald-600" : "text-sm text-destructive"}>
                {gain >= 0 ? "+" : ""}
                {gain.toLocaleString()} บาท ({gainPercent >= 0 ? "+" : ""}
                {gainPercent.toFixed(1)}%)
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {assets.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <PiggyBank className="size-8 text-secondary" />
          <p>ยังไม่มีทรัพย์สินในพอร์ต กดปุ่ม + เพื่อเพิ่มรายการแรก</p>
        </div>
      )}

      <div className="flex flex-col gap-2">
        {assets.map((asset) => {
          const assetGain = asset.current_value - asset.invested_amount;
          return (
            <div
              key={asset.id}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-warm ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-warm-lg"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{asset.name}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <Badge variant="accent">{PERSONAL_ASSET_TYPE_LABELS[asset.type]}</Badge>
                  {asset.invested_amount > 0 && (
                    <span
                      className={
                        assetGain >= 0
                          ? "text-xs text-emerald-600"
                          : "text-xs text-destructive"
                      }
                    >
                      {assetGain >= 0 ? "+" : ""}
                      {assetGain.toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
              <span className="whitespace-nowrap font-semibold">
                ฿{asset.current_value.toLocaleString()}
              </span>
              <EditAssetValueDialog asset={asset} />
              <Button
                variant="ghost"
                size="icon"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(asset.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
