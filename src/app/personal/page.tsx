import { redirect } from "next/navigation";
import { PersonalLedger } from "@/components/personal/personal-ledger";
import { createClient } from "@/lib/supabase/server";

export default async function PersonalPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return <PersonalLedger currentUserId={user.id} />;
}
