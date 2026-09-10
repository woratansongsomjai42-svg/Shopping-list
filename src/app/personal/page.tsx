import { redirect } from "next/navigation";
import { PersonalLedger } from "@/components/personal/personal-ledger";
import { createClient } from "@/lib/supabase/server";

export default async function PersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { tab } = await searchParams;
  const initialTab = tab === "mood" || tab === "assets" ? tab : "transactions";

  return <PersonalLedger currentUserId={user.id} initialTab={initialTab} />;
}
