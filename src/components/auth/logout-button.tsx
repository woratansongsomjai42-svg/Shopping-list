"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { logout } from "@/lib/actions/auth";

export function LogoutButton() {
  return (
    <Button variant="ghost" size="icon" onClick={() => logout()} title="ออกจากระบบ">
      <LogOut className="size-4" />
    </Button>
  );
}
