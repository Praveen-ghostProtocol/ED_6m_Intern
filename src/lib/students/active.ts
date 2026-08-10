import { createClient } from "@/lib/supabase/server";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export function embeddedProfileIsActive(profiles: unknown) {
  const profile = one(profiles as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
  return profile?.is_active === true;
}

export function embeddedStudentIsActive(studentValue: unknown) {
  const student = one(studentValue as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
  return embeddedProfileIsActive(student?.profiles);
}

export async function getActiveStudentIds(supabase: SupabaseServerClient) {
  const { data } = await supabase
    .from("students")
    .select("id,profiles(is_active)");

  return (data ?? [])
    .filter((student) => embeddedProfileIsActive(student.profiles))
    .map((student) => student.id as string);
}
