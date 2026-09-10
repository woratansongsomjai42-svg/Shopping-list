import { createClient } from "@/lib/supabase/client";
import type { MoodLog, NewMoodLog } from "@/types/models";

// RLS restricts every query here to the caller's own rows, so there's no
// need to filter by user_id client-side — it's always "my" data.

export async function getMoodLogs(): Promise<MoodLog[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("mood_logs")
    .select("*")
    .order("mood_date", { ascending: false });

  if (error) throw error;
  return data;
}

/** One entry per user per day — upsert on (user_id, mood_date). */
export async function upsertMoodLog(entry: NewMoodLog): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("mood_logs")
    .upsert(entry, { onConflict: "user_id,mood_date" });
  if (error) throw error;
}

export async function deleteMoodLog(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("mood_logs").delete().eq("id", id);
  if (error) throw error;
}
