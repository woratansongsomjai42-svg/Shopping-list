import { redirect } from "next/navigation";
import { ExpenseList } from "@/components/expenses/expense-list";
import { createClient } from "@/lib/supabase/server";

export default async function ExpensesPage() {
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

  return <ExpenseList householdId={membership.household_id} currentUserId={user.id} />;
}
