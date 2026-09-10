import { createClient } from "@/lib/supabase/client";

/** Uploads to the user's own folder in the `avatars` bucket and returns a cache-busted public URL. */
export async function uploadAvatar(userId: string, file: File): Promise<string> {
  const supabase = createClient();
  const ext = file.name.split(".").pop() ?? "jpg";
  const path = `${userId}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true, cacheControl: "3600" });
  if (uploadError) throw uploadError;

  const { data } = supabase.storage.from("avatars").getPublicUrl(path);
  const avatarUrl = `${data.publicUrl}?t=${Date.now()}`;

  const { error: authError } = await supabase.auth.updateUser({
    data: { avatar_url: avatarUrl },
  });
  if (authError) throw authError;

  // Keep every household_members row in sync so other members see the update.
  const { error: memberError } = await supabase
    .from("household_members")
    .update({ avatar_url: avatarUrl })
    .eq("user_id", userId);
  if (memberError) throw memberError;

  return avatarUrl;
}

export async function updateDisplayName(userId: string, displayName: string): Promise<void> {
  const supabase = createClient();

  const { error: authError } = await supabase.auth.updateUser({
    data: { display_name: displayName },
  });
  if (authError) throw authError;

  const { error: memberError } = await supabase
    .from("household_members")
    .update({ display_name: displayName })
    .eq("user_id", userId);
  if (memberError) throw memberError;
}
