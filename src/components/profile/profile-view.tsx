"use client";

import { ArrowLeft, Mail, Settings, UserPlus } from "lucide-react";
import Link from "next/link";
import { LogoutButton } from "@/components/auth/logout-button";
import { AvatarUploader } from "@/components/profile/avatar-uploader";
import { EditDisplayName } from "@/components/profile/edit-display-name";
import { MemberList } from "@/components/settings/member-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";

export function ProfileView({
  currentUserId,
  email,
  displayName,
  avatarUrl,
  householdId,
  isOwner,
}: {
  currentUserId: string;
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  householdId: string | null;
  isOwner: boolean;
}) {
  return (
    <div className="mx-auto flex max-w-lg flex-col gap-4 p-4 pb-24">
      <div className="flex items-center gap-2">
        <Link href="/shopping">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="size-4" />
          </Button>
        </Link>
        <h1 className="text-xl font-semibold">โปรไฟล์</h1>
      </div>

      <Card>
        <CardContent className="flex flex-col items-center gap-4 text-center">
          <AvatarUploader
            currentUserId={currentUserId}
            displayName={displayName}
            avatarUrl={avatarUrl}
          />

          <div className="w-full space-y-2 text-left">
            <Label htmlFor="profile-name">ชื่อที่แสดง</Label>
            <EditDisplayName currentUserId={currentUserId} initialName={displayName ?? ""} />
          </div>

          <div className="flex w-full items-center gap-2 text-sm text-muted-foreground">
            <Mail className="size-4 shrink-0" />
            {email}
          </div>
        </CardContent>
      </Card>

      {householdId ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-sm font-medium text-muted-foreground">
                สมาชิกในบ้าน
                <Link href="/settings/invite">
                  <Button size="sm" variant="secondary" className="gap-1.5">
                    <UserPlus className="size-4" /> เชิญสมาชิก
                  </Button>
                </Link>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <MemberList
                householdId={householdId}
                currentUserId={currentUserId}
                isOwner={isOwner}
              />
            </CardContent>
          </Card>

          <Link href="/settings">
            <Button variant="outline" className="w-full gap-1.5">
              <Settings className="size-4" /> ตั้งค่าบ้าน
            </Button>
          </Link>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">คุณยังไม่ได้เข้าร่วมบ้านไหนเลย</p>
      )}

      <LogoutButton full />
    </div>
  );
}
