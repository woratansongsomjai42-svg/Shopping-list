import { redirect } from "next/navigation";
import { ShoppingList } from "@/components/shopping/shopping-list";
import { createClient } from "@/lib/supabase/server";

export default async function ShoppingPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();
  if (!membership) redirect("/onboarding");

  return <ShoppingList householdId={membership.household_id} currentUserId={user.id} />;
}
