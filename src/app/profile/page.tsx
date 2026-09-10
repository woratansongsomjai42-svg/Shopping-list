import { redirect } from "next/navigation";
import { ProfileView } from "@/components/profile/profile-view";
import { createClient } from "@/lib/supabase/server";

export default async function ProfilePage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: membership } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", user.id)
    .limit(1)
    .maybeSingle();

  return (
    <ProfileView
      currentUserId={user.id}
      email={user.email ?? ""}
      displayName={(user.user_metadata?.display_name as string | undefined) ?? null}
      avatarUrl={(user.user_metadata?.avatar_url as string | undefined) ?? null}
      householdId={membership?.household_id ?? null}
      isOwner={membership?.role === "owner"}
    />
  );
}
