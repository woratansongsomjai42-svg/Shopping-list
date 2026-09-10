import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, UserPlus } from "lucide-react";
import { DeleteHouseholdDialog } from "@/components/settings/delete-household-dialog";
import { EditHouseholdNameDialog } from "@/components/settings/edit-household-name-dialog";
import { MemberList } from "@/components/settings/member-list";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/server";

export default async function SettingsPage() {
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
  if (!membership) redirect("/onboarding");

  const { data: household } = await supabase
    .from("households")
    .select("name")
    .eq("id", membership.household_id)
    .single();
  const isOwner = membership.role === "owner";

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Link href="/shopping">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-xl font-semibold">{household?.name}</h1>
          <p className="text-sm text-muted-foreground">จัดการสมาชิกในบ้าน</p>
        </div>
        {isOwner && household && (
          <EditHouseholdNameDialog householdId={membership.household_id} currentName={household.name} />
        )}
        <Link href="/settings/invite">
          <Button variant="ghost" size="icon" title="เชิญสมาชิก">
            <UserPlus className="size-4" />
          </Button>
        </Link>
      </div>

      <MemberList
        householdId={membership.household_id}
        currentUserId={user.id}
        isOwner={isOwner}
      />

      {isOwner && household && (
        <div className="mt-4 space-y-2 rounded-lg border border-destructive/30 p-3">
          <h2 className="text-sm font-medium text-destructive">โซนอันตราย</h2>
          <p className="text-sm text-muted-foreground">
            ลบบ้านนี้พร้อมรายการของ รายจ่าย และสมาชิกทั้งหมดอย่างถาวร
          </p>
          <DeleteHouseholdDialog householdId={membership.household_id} householdName={household.name} />
        </div>
      )}
    </div>
  );
}
