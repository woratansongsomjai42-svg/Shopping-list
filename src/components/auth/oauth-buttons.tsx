"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

const PROVIDERS = [
  { id: "google", label: "Google" },
  { id: "github", label: "GitHub" },
] as const;

export function OAuthButtons() {
  async function handleSignIn(provider: (typeof PROVIDERS)[number]["id"]) {
    const supabase = createClient();
    await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/auth/callback?next=/shopping` },
    });
  }

  return (
    <div className="space-y-2">
      <div className="relative flex items-center py-1">
        <div className="flex-1 border-t" />
        <span className="mx-2 text-xs text-muted-foreground">หรือ</span>
        <div className="flex-1 border-t" />
      </div>
      {PROVIDERS.map((provider) => (
        <Button
          key={provider.id}
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => handleSignIn(provider.id)}
        >
          เข้าสู่ระบบด้วย {provider.label}
        </Button>
      ))}
    </div>
  );
}
