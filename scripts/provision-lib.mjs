import { existsSync, readFileSync } from "node:fs";
import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

export const defaultOrganizerEmail = "organizer.test@ed-internships.local";
export const defaultRecruiterEmail = "recruiter.test@ed-internships.local";

export function loadEnvFiles() {
  for (const path of [".env.local", ".env"]) {
    if (!existsSync(path)) continue;

    const lines = readFileSync(path, "utf8").split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
      const index = trimmed.indexOf("=");
      const key = trimmed.slice(0, index).trim();
      const rawValue = trimmed.slice(index + 1).trim();
      const value = rawValue.replace(/^['"]|['"]$/g, "");
      if (!process.env[key]) process.env[key] = value;
    }
  }
}

export function requireSupabaseAdmin() {
  loadEnvFiles();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Add them to .env.local first.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });
}

export function readStudentSeed(path = "supabase/seed/students.csv") {
  const csv = readFileSync(path, "utf8").trim();
  const [header, ...rows] = csv.split(/\r?\n/);
  const columns = header.split(",");
  const rollIndex = columns.indexOf("roll_number");
  const emailIndex = columns.indexOf("email");

  if (rollIndex === -1 || emailIndex === -1) {
    throw new Error("Student seed CSV must contain roll_number,email headers.");
  }

  return rows.map((row) => {
    const values = row.split(",");
    return {
      roll_number: values[rollIndex].trim(),
      email: values[emailIndex].trim().toLowerCase()
    };
  });
}

export function temporaryPassword() {
  return `ED-${randomBytes(9).toString("base64url")}-Tmp1`;
}

export function csvEscape(value) {
  const text = String(value ?? "");
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function printCredentialHeader() {
  console.log("email,role,temporary_password,linked_record,status");
}

export function printCredentialRow({ email, role, password, linkedRecord, status }) {
  console.log([email, role, password, linkedRecord, status].map(csvEscape).join(","));
}

export async function listAllAuthUsers(supabase) {
  const users = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...(data.users ?? []));
    if (!data.users || data.users.length < 1000) break;
    page += 1;
  }

  return users;
}

export async function createOrResetAuthUser(supabase, userIndex, { email, password, role }) {
  const existing = userIndex.get(email.toLowerCase());
  if (existing) {
    const { data, error } = await supabase.auth.admin.updateUserById(existing.id, {
      password,
      email_confirm: true,
      user_metadata: { ...(existing.user_metadata ?? {}), role }
    });

    if (error) {
      throw new Error(`Could not reset ${email}: ${error.message}`);
    }

    userIndex.set(email.toLowerCase(), data.user);
    return { user: data.user, created: false, passwordReset: true };
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { role }
  });

  if (error) {
    throw new Error(`Could not create ${email}: ${error.message}`);
  }

  userIndex.set(email.toLowerCase(), data.user);
  return { user: data.user, created: true, passwordReset: false };
}

export const createOrGetAuthUser = createOrResetAuthUser;

export async function upsertProfile(supabase, { id, email, role, fullName = null }) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id,
      email,
      role,
      full_name: fullName,
      must_change_password: true,
      is_active: true
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}