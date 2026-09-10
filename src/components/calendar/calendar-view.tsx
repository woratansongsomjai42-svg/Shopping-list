"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { AddReminderDialog } from "@/components/calendar/add-reminder-dialog";
import { BottomNav } from "@/components/nav/bottom-nav";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { deleteReminder, getReminders } from "@/lib/queries/reminders";
import type { Reminder } from "@/types/models";

const WEEKDAY_LABELS = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

function toDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function todayKey() {
  return toDateKey(new Date());
}

function parseDateKey(key: string) {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function ReminderRow({
  reminder,
  onDelete,
  deleting,
}: {
  reminder: Reminder;
  onDelete: (id: string) => void;
  deleting: boolean;
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl bg-card p-3 shadow-warm ring-1 ring-border">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{reminder.title}</p>
        <p className="text-xs text-muted-foreground">
          {reminder.due_time ? reminder.due_time.slice(0, 5) : "ทั้งวัน"}
          {reminder.note ? ` · ${reminder.note}` : ""}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        disabled={deleting}
        onClick={() => onDelete(reminder.id)}
      >
        <Trash2 className="size-4" />
      </Button>
    </div>
  );
}

export function CalendarView({
  householdId,
  currentUserId,
}: {
  householdId: string;
  currentUserId: string;
}) {
  const queryClient = useQueryClient();
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(todayKey());

  const monthLabel = monthCursor.toLocaleDateString("th-TH", { month: "long", year: "numeric" });

  const { data: reminders = [] } = useQuery({
    queryKey: ["reminders", householdId],
    queryFn: () => getReminders(householdId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteReminder(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reminders", householdId] }),
    onError: () => toast.error("ลบไม่สำเร็จ"),
  });

  const remindersByDate = useMemo(() => {
    const map = new Map<string, typeof reminders>();
    for (const r of reminders) {
      const list = map.get(r.due_date) ?? [];
      list.push(r);
      map.set(r.due_date, list);
    }
    return map;
  }, [reminders]);

  const weeks = useMemo(() => {
    const firstDay = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const daysInMonth = new Date(
      monthCursor.getFullYear(),
      monthCursor.getMonth() + 1,
      0,
    ).getDate();
    const leadingBlanks = firstDay.getDay();

    const cells: (Date | null)[] = [
      ...Array(leadingBlanks).fill(null),
      ...Array.from(
        { length: daysInMonth },
        (_, i) => new Date(monthCursor.getFullYear(), monthCursor.getMonth(), i + 1),
      ),
    ];
    while (cells.length % 7 !== 0) cells.push(null);

    const result: (Date | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) result.push(cells.slice(i, i + 7));
    return result;
  }, [monthCursor]);

  const selectedReminders = remindersByDate.get(selectedDate) ?? [];

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">ปฏิทิน</h1>
        <AddReminderDialog
          householdId={householdId}
          currentUserId={currentUserId}
          selectedDate={selectedDate}
        />
      </div>

      <div className="rounded-2xl bg-card p-3 shadow-warm ring-1 ring-border">
        <div className="mb-2 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() - 1, 1))
            }
          >
            <ChevronLeft className="size-4" />
          </Button>
          <p className="font-medium">{monthLabel}</p>
          <Button
            variant="ghost"
            size="icon"
            onClick={() =>
              setMonthCursor((c) => new Date(c.getFullYear(), c.getMonth() + 1, 1))
            }
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>

        <div className="grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
          {WEEKDAY_LABELS.map((label) => (
            <div key={label} className="py-1">
              {label}
            </div>
          ))}
        </div>

        {weeks.map((week, i) => (
          <div key={i} className="grid grid-cols-7 gap-1">
            {week.map((date, j) => {
              if (!date) return <div key={j} />;
              const key = toDateKey(date);
              const isSelected = key === selectedDate;
              const isToday = key === todayKey();
              const hasReminders = remindersByDate.has(key);

              return (
                <button
                  key={j}
                  type="button"
                  onClick={() => setSelectedDate(key)}
                  className={cn(
                    "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-xl text-sm transition-colors",
                    isSelected
                      ? "bg-primary text-primary-foreground"
                      : isToday
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-muted",
                  )}
                >
                  {date.getDate()}
                  {hasReminders && <span className="size-1 rounded-full bg-secondary" />}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">
          {parseDateKey(selectedDate).toLocaleDateString("th-TH", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </h2>

        {selectedReminders.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ไม่มีรายการวันนี้ กดปุ่ม + เพื่อเพิ่มเตือนความจำ
          </p>
        )}

        {selectedReminders.map((r) => (
          <ReminderRow
            key={r.id}
            reminder={r}
            deleting={deleteMutation.isPending}
            onDelete={(id) => deleteMutation.mutate(id)}
          />
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <h2 className="text-sm font-medium text-muted-foreground">เตือนความจำทั้งหมด</h2>

        {reminders.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            ยังไม่มีเตือนความจำเลย
          </p>
        ) : (
          [...remindersByDate.entries()].map(([date, dateReminders]) => (
            <section key={date} className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setSelectedDate(date)}
                className={cn(
                  "self-start text-xs font-medium underline-offset-2 hover:underline",
                  date === todayKey() ? "text-primary" : "text-muted-foreground",
                )}
              >
                {parseDateKey(date).toLocaleDateString("th-TH", {
                  weekday: "short",
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </button>
              {dateReminders.map((r) => (
                <ReminderRow
                  key={r.id}
                  reminder={r}
                  deleting={deleteMutation.isPending}
                  onDelete={(id) => deleteMutation.mutate(id)}
                />
              ))}
            </section>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
