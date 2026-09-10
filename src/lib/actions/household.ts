"use server";

import { redirect } from "next/navigation";
import { MAX_HOUSEHOLDS_PER_USER } from "@/lib/constants";
import { createClient } from "@/lib/supabase/server";

function friendlyHouseholdError(message: string) {
  if (message.includes("HOUSEHOLD_LIMIT_REACHED")) {
    return `คุณเข้าร่วมได้สูงสุด ${MAX_HOUSEHOLDS_PER_USER} บ้านเท่านั้น ออกจากบ้านเดิมก่อนจึงจะสร้างหรือเข้าร่วมบ้านใหม่ได้`;
  }
  return message;
}

export async function createHousehold(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const name = formData.get("name") as string;

  const { error } = await supabase.from("households").insert({ name, created_by: user.id });
  if (error) redirect(`/onboarding?error=${encodeURIComponent(friendlyHouseholdError(error.message))}`);

  redirect("/shopping");
}

export async function joinHousehold(formData: FormData) {
  const supabase = await createClient();
  const inviteCode = (formData.get("inviteCode") as string).trim();

  const { error } = await supabase.rpc("join_household_by_invite_code", {
    p_invite_code: inviteCode,
  });
  if (error) {
    const message = error.message.includes("HOUSEHOLD_LIMIT_REACHED")
      ? friendlyHouseholdError(error.message)
      : "รหัสเชิญไม่ถูกต้อง ลองตรวจสอบอีกครั้ง";
    redirect(`/onboarding?error=${encodeURIComponent(message)}`);
  }

  redirect("/shopping");
}
