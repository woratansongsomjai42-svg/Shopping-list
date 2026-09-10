import { createClient } from "@/lib/supabase/client";
import type { NewReminder, Reminder } from "@/types/models";

export async function getReminders(householdId: string): Promise<Reminder[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("reminders")
    .select("*")
    .eq("household_id", householdId)
    .order("due_date", { ascending: true })
    .order("due_time", { ascending: true, nullsFirst: false });

  if (error) throw error;
  return data;
}

export async function addReminder(reminder: NewReminder): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("reminders").insert(reminder);
  if (error) throw error;
}

export async function deleteReminder(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("reminders").delete().eq("id", id);
  if (error) throw error;
}
