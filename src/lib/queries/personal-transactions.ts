import { createClient } from "@/lib/supabase/client";
import type { NewPersonalTransaction, PersonalTransaction } from "@/types/models";

// RLS restricts every query here to the caller's own rows, so there's no
// need to filter by user_id client-side — it's always "my" data.

export async function getPersonalTransactions(): Promise<PersonalTransaction[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("personal_transactions")
    .select("*")
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

export async function addPersonalTransaction(
  transaction: NewPersonalTransaction,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("personal_transactions").insert(transaction);
  if (error) throw error;
}

export async function deletePersonalTransaction(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("personal_transactions").delete().eq("id", id);
  if (error) throw error;
}
