"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";

export function LogoutButton({ full = false }: { full?: boolean }) {
  if (full) {
    return (
      <Button variant="outline" className="w-full gap-1.5" onClick={() => logout()}>
        <LogOut className="size-4" /> ออกจากระบบ
      </Button>
    );
  }

  return (
    <Button variant="ghost" size="icon" onClick={() => logout()} title="ออกจากระบบ">
      <LogOut className="size-4" />
    </Button>
  );
}
