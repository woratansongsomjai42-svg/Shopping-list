import { createClient } from "@/lib/supabase/client";
import type { Household, HouseholdMember, MemberRole } from "@/types/models";

export async function getHouseholdMembers(householdId: string): Promise<HouseholdMember[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("household_members")
    .select("*")
    .eq("household_id", householdId);

  if (error) throw error;
  return data;
}

export async function getHousehold(householdId: string): Promise<Household> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("households")
    .select("*")
    .eq("id", householdId)
    .single();

  if (error) throw error;
  return data;
}

export async function updateMemberRole(
  householdId: string,
  userId: string,
  role: MemberRole,
): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("household_members")
    .update({ role })
    .eq("household_id", householdId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function removeMember(householdId: string, userId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("household_members")
    .delete()
    .eq("household_id", householdId)
    .eq("user_id", userId);

  if (error) throw error;
}

export async function updateHouseholdName(householdId: string, name: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("households").update({ name }).eq("id", householdId);
  if (error) throw error;
}

/** Cascades to household_members, shopping_items, expenses, and expense_splits. */
export async function deleteHousehold(householdId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("households").delete().eq("id", householdId);
  if (error) throw error;
}
