import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { requestPasswordReset } from "@/lib/actions/auth";

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const { message } = await searchParams;

  return (
    <div className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>ลืมรหัสผ่าน</CardTitle>
          <CardDescription>กรอกอีเมลของคุณ เราจะส่งลิงก์สำหรับตั้งรหัสผ่านใหม่ไปให้</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={requestPasswordReset} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">อีเมล</Label>
              <Input id="email" name="email" type="email" required autoComplete="email" />
            </div>

            {message && <p className="text-sm text-muted-foreground">{message}</p>}

            <Button type="submit" className="w-full">
              ส่งลิงก์รีเซ็ตรหัสผ่าน
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            นึกรหัสผ่านออกแล้ว?{" "}
            <Link href="/login" className="font-medium text-foreground underline">
              เข้าสู่ระบบ
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
