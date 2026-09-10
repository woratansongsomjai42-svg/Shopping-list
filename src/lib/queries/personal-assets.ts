import { createClient } from "@/lib/supabase/client";
import type { NewPersonalAsset, PersonalAsset } from "@/types/models";

// RLS restricts every query here to the caller's own rows.

export async function getPersonalAssets(): Promise<PersonalAsset[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("personal_assets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addPersonalAsset(asset: NewPersonalAsset): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("personal_assets").insert(asset);
  if (error) throw error;
}

export async function updatePersonalAssetValue(
  id: string,
  currentValue: number,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("personal_assets")
    .update({ current_value: currentValue })
    .eq("id", id);
  if (error) throw error;
}

export async function deletePersonalAsset(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("personal_assets").delete().eq("id", id);
  if (error) throw error;
}
