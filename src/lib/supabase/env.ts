const fallbackSupabaseUrl = "http://127.0.0.1:54321";
const fallbackSupabaseAnonKey = "phase-2-placeholder-anon-key";

function shouldRequirePublicSupabaseEnv() {
  return process.env.VERCEL_ENV === "production" || process.env.REQUIRE_SUPABASE_ENV === "true";
}

function requirePublicSupabaseEnv(name: "NEXT_PUBLIC_SUPABASE_URL" | "NEXT_PUBLIC_SUPABASE_ANON_KEY") {
  const value = process.env[name];

  if (value) {
    return value;
  }

  if (shouldRequirePublicSupabaseEnv()) {
    throw new Error(`${name} is required in production.`);
  }

  return null;
}

export function getSupabaseUrl() {
  return requirePublicSupabaseEnv("NEXT_PUBLIC_SUPABASE_URL") || fallbackSupabaseUrl;
}

export function getSupabaseAnonKey() {
  return requirePublicSupabaseEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY") || fallbackSupabaseAnonKey;
}

export function hasSupabasePublicEnv() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function assertSupabasePublicEnv() {
  requirePublicSupabaseEnv("NEXT_PUBLIC_SUPABASE_URL");
  requirePublicSupabaseEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}
export function getSupabaseServiceRoleKey() {
  const value = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!value) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for server-only admin operations.");
  }

  return value;
}
