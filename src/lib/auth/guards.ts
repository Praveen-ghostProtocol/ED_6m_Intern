import { redirect } from "next/navigation";
import { roleHomePath, roles, type AppRole } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/types/auth";

export async function getCurrentProfile(): Promise<Profile | null> {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("id,email,role,full_name,must_change_password,is_active")
    .eq("id", user.id)
    .single();

  if (error || !data || !roles.includes(data.role as AppRole) || !data.is_active) {
    return null;
  }

  return data as Profile;
}

export async function requireProfile() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  if (profile.must_change_password) {
    redirect("/change-password");
  }

  return profile;
}

export async function requireRole(role: AppRole) {
  const profile = await requireProfile();

  if (profile.role !== role) {
    redirect(roleHomePath[profile.role]);
  }

  return profile;
}