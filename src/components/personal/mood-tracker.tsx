"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Smile, Trash2 } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { deleteMoodLog, getMoodLogs, upsertMoodLog } from "@/lib/queries/mood-logs";
import { MOOD_EMOJI, MOOD_LABELS, type MoodLevel } from "@/types/models";

const MOOD_LEVELS: MoodLevel[] = [1, 2, 3, 4, 5];

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

function monthKey(dateStr: string) {
  return dateStr.slice(0, 7);
}

function monthLabel(key: string) {
  return new Date(`${key}-01`).toLocaleDateString("th-TH", { year: "numeric", month: "long" });
}

function weekKey(dateStr: string) {
  const d = new Date(dateStr);
  const mondayOffset = (d.getUTCDay() + 6) % 7; // days since Monday
  d.setUTCDate(d.getUTCDate() - mondayOffset);
  return d.toISOString().slice(0, 10);
}

function weekLabel(mondayKey: string) {
  const monday = new Date(mondayKey);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const fmt = (d: Date) => d.toLocaleDateString("th-TH", { day: "numeric", month: "short" });
  return `สัปดาห์ ${fmt(monday)} – ${fmt(sunday)}`;
}

export function MoodTracker({ currentUserId }: { currentUserId: string }) {
  const queryClient = useQueryClient();
  const [range, setRange] = useState<"week" | "month">("week");
  const noteRef = useRef<HTMLInputElement>(null);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["mood-logs"],
    queryFn: getMoodLogs,
  });

  const today = todayISO();
  const todayEntry = logs.find((l) => l.mood_date === today);

  const saveMutation = useMutation({
    mutationFn: (mood: MoodLevel) =>
      upsertMoodLog({
        user_id: currentUserId,
        mood_date: today,
        mood,
        note: noteRef.current?.value.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["mood-logs"] });
      toast.success("บันทึกอารมณ์วันนี้แล้ว");
    },
    onError: () => toast.error("บันทึกไม่สำเร็จ ลองใหม่อีกครั้ง"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteMoodLog(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["mood-logs"] }),
    onError: () => toast.error("ลบไม่สำเร็จ"),
  });

  const groups = useMemo(() => {
    const keyFn = range === "week" ? weekKey : monthKey;
    const labelFn = range === "week" ? weekLabel : monthLabel;
    const byKey = new Map<string, typeof logs>();
    for (const log of logs) {
      const key = keyFn(log.mood_date);
      const list = byKey.get(key) ?? [];
      list.push(log);
      byKey.set(key, list);
    }
    return [...byKey.entries()].map(([key, list]) => [labelFn(key), list] as const);
  }, [logs, range]);

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent className="flex flex-col gap-3">
          <p className="text-sm font-medium">วันนี้รู้สึกยังไง?</p>
          <div className="flex justify-between gap-2">
            {MOOD_LEVELS.map((level) => (
              <button
                key={level}
                type="button"
                onClick={() => saveMutation.mutate(level)}
                disabled={saveMutation.isPending}
                className={cn(
                  "flex flex-1 flex-col items-center gap-1 rounded-2xl p-3 text-2xl transition-all duration-200 hover:-translate-y-0.5",
                  todayEntry?.mood === level ? "bg-primary/15 ring-2 ring-primary" : "bg-muted",
                )}
              >
                <span>{MOOD_EMOJI[level]}</span>
                <span className="text-[10px] font-normal text-muted-foreground">
                  {MOOD_LABELS[level]}
                </span>
              </button>
            ))}
          </div>
          <Input
            key={todayEntry?.id ?? "new"}
            ref={noteRef}
            defaultValue={todayEntry?.note ?? ""}
            placeholder="โน้ตเพิ่มเติม (ไม่บังคับ)"
          />
        </CardContent>
      </Card>

      <Tabs value={range} onValueChange={(v) => v && setRange(v as "week" | "month")}>
        <TabsList className="w-full">
          <TabsTrigger value="week" className="flex-1">
            รายสัปดาห์
          </TabsTrigger>
          <TabsTrigger value="month" className="flex-1">
            รายเดือน
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {isLoading && <p className="text-sm text-muted-foreground">กำลังโหลด...</p>}

      {!isLoading && logs.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-12 text-center text-sm text-muted-foreground">
          <Smile className="size-8 text-secondary" />
          <p>ยังไม่มีบันทึกอารมณ์ เลือกอารมณ์วันนี้เพื่อเริ่มเก็บสถิติ</p>
        </div>
      )}

      {groups.map(([label, groupLogs]) => (
        <section key={label} className="flex flex-col gap-2">
          <h2 className="text-sm font-medium text-muted-foreground">{label}</h2>
          {groupLogs.map((log) => (
            <div
              key={log.id}
              className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-warm ring-1 ring-border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-warm-lg"
            >
              <span className="text-2xl">{MOOD_EMOJI[log.mood as MoodLevel]}</span>
              <div className="min-w-0 flex-1">
                <p className="font-medium">
                  {new Date(log.mood_date).toLocaleDateString("th-TH", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}{" "}
                  · {MOOD_LABELS[log.mood as MoodLevel]}
                </p>
                {log.note && <p className="truncate text-sm text-muted-foreground">{log.note}</p>}
              </div>
              <Button
                variant="ghost"
                size="icon"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(log.id)}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
        </section>
      ))}
    </div>
  );
}
