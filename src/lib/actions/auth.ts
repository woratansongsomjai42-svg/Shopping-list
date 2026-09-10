"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function getOrigin() {
  const headersList = await headers();
  const host = headersList.get("host")!;
  const protocol = host.startsWith("localhost") ? "http" : "https";
  return `${protocol}://${host}`;
}

export async function login(formData: FormData) {
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
  });

  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);

  redirect("/shopping");
}

export async function signup(formData: FormData) {
  const supabase = await createClient();
  const displayName = formData.get("displayName") as string;

  const { data, error } = await supabase.auth.signUp({
    email: formData.get("email") as string,
    password: formData.get("password") as string,
    options: { data: { display_name: displayName } },
  });

  if (error) redirect(`/register?error=${encodeURIComponent(error.message)}`);

  if (!data.session) {
    redirect(`/login?message=${encodeURIComponent("ยืนยันอีเมลของคุณก่อน แล้วค่อยเข้าสู่ระบบ")}`);
  }

  redirect("/shopping");
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function requestPasswordReset(formData: FormData) {
  const supabase = await createClient();
  const email = formData.get("email") as string;
  const origin = await getOrigin();

  // Always show the same message, regardless of whether the email exists,
  // so this can't be used to enumerate registered accounts.
  await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/confirm?type=recovery&next=/reset-password`,
  });

  redirect(
    `/forgot-password?message=${encodeURIComponent("ถ้าอีเมลนี้มีอยู่ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านไปให้แล้ว")}`,
  );
}

export async function updatePassword(formData: FormData) {
  const supabase = await createClient();
  const password = formData.get("password") as string;

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/reset-password?error=${encodeURIComponent(error.message)}`);

  redirect("/shopping");
}
