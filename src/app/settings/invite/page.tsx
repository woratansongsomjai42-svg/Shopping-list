import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CopyInviteCodeButton } from "@/components/household/copy-invite-code-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";

export default async function InvitePage() {
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

  const { data: household } = await supabase
    .from("households")
    .select("name, invite_code")
    .eq("id", membership.household_id)
    .single();

  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Link href="/settings">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">เชิญสมาชิก</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>รหัสเชิญของ {household?.name}</CardTitle>
          <CardDescription>
            แชร์รหัสนี้ให้สมาชิกในบ้าน แล้วให้พวกเขากรอกในหน้า &ldquo;เข้าร่วมบ้าน&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded-md border bg-muted px-3 py-3 text-center text-2xl font-semibold tracking-widest">
              {household?.invite_code}
            </code>
            {household && <CopyInviteCodeButton code={household.invite_code} />}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
