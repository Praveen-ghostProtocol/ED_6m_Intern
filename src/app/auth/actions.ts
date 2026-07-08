"use server";

import { redirect } from "next/navigation";
import { roleHomePath, roles, type AppRole } from "@/lib/rbac";
import { hasSupabasePublicEnv } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export type AuthActionState = {
  error?: string;
};

function normalizeEmail(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizePassword(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : "";
}

function safeNextPath(value: FormDataEntryValue | null, role: AppRole) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return roleHomePath[role];
  }

  return value === roleHomePath[role] || value.startsWith(`${roleHomePath[role]}/`)
    ? value
    : roleHomePath[role];
}

export async function signIn(_previousState: AuthActionState, formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = normalizePassword(formData.get("password"));

  if (!email || !password) {
    return { error: "Enter both email and password." };
  }

  if (!hasSupabasePublicEnv()) {
    return { error: "Supabase is not configured yet. Add .env.local values before testing login." };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: "The email or password is incorrect." };
  }

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Could not start a secure session. Please try again." };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role,must_change_password,is_active")
    .eq("id", user.id)
    .single();

  if (!profile?.is_active || !roles.includes(profile.role as AppRole)) {
    await supabase.auth.signOut();
    return { error: "This account is not active on the internship portal." };
  }

  const role = profile.role as AppRole;

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  redirect(safeNextPath(formData.get("next"), role));
}

export async function changePassword(_previousState: AuthActionState, formData: FormData) {
  const password = normalizePassword(formData.get("password"));
  const confirmPassword = normalizePassword(formData.get("confirmPassword"));

  if (password.length < 8) {
    return { error: "Use at least 8 characters for the new password." };
  }

  if (password !== confirmPassword) {
    return { error: "The confirmation password does not match." };
  }

  if (!hasSupabasePublicEnv()) {
    return { error: "Supabase is not configured yet. Add .env.local values before changing passwords." };
  }

  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { error } = await supabase.auth.updateUser({ password });

  if (error) {
    return { error: "Could not update the password. Please try again." };
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .update({ must_change_password: false })
    .eq("id", user.id)
    .select("role")
    .single();

  if (profileError || !profile || !roles.includes(profile.role as AppRole)) {
    return { error: "Password changed, but profile access could not be confirmed." };
  }

  redirect(roleHomePath[profile.role as AppRole]);
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}