import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createHousehold, joinHousehold } from "@/lib/actions/household";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
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
  if (membership) redirect("/shopping");

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>เริ่มต้นใช้งาน HomeTrack</CardTitle>
          <CardDescription>สร้างบ้านใหม่ หรือเข้าร่วมบ้านที่มีอยู่แล้ว</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="create">
            <TabsList className="w-full">
              <TabsTrigger value="create" className="flex-1">
                สร้างบ้านใหม่
              </TabsTrigger>
              <TabsTrigger value="join" className="flex-1">
                เข้าร่วมบ้าน
              </TabsTrigger>
            </TabsList>

            <TabsContent value="create" className="mt-4">
              <form action={createHousehold} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">ชื่อบ้าน</Label>
                  <Input id="name" name="name" required placeholder="เช่น บ้านสุขสันต์" />
                </div>
                <Button type="submit" className="w-full">
                  สร้างบ้าน
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="join" className="mt-4">
              <form action={joinHousehold} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="inviteCode">รหัสเชิญ</Label>
                  <Input
                    id="inviteCode"
                    name="inviteCode"
                    required
                    placeholder="เช่น A1B2C3D4"
                    className="uppercase"
                  />
                </div>
                <Button type="submit" className="w-full">
                  เข้าร่วมบ้าน
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
