import { existsSync, readFileSync } from "node:fs";

const requiredFiles = [
  "package.json",
  ".env.example",
  "supabase/migrations/001_initial_schema.sql",
  "supabase/migrations/002_resume_storage.sql",
  "supabase/migrations/003_api_grants_and_rls_fix.sql",
  "supabase/migrations/004_service_role_grants.sql",
  "supabase/migrations/005_student_profile_details.sql",
  "supabase/seed/students.csv",
  "scripts/provision-students.mjs",
  "scripts/provision-test-users.mjs",
  "scripts/provision-demo-data.mjs",
  "scripts/e2e-smoke.mjs"
];

function loadEnv(path) {
  if (!existsSync(path)) return {};
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function readStudentCount() {
  if (!existsSync("supabase/seed/students.csv")) return 0;
  const csv = readFileSync("supabase/seed/students.csv", "utf8").trim();
  return Math.max(0, csv.split(/\r?\n/).length - 1);
}

const envLocal = loadEnv(".env.local");
const checks = [];

for (const file of requiredFiles) {
  checks.push({ label: `file:${file}`, ok: existsSync(file), required: true });
}

checks.push({ label: "student seed has 78 rows", ok: readStudentCount() === 78, required: true });
checks.push({ label: ".env.local configured", warnLabel: ".env.local missing; live Supabase actions will not work yet", ok: existsSync(".env.local"), required: false });
checks.push({ label: "NEXT_PUBLIC_SUPABASE_URL configured", warnLabel: "NEXT_PUBLIC_SUPABASE_URL missing in .env.local", ok: Boolean(envLocal.NEXT_PUBLIC_SUPABASE_URL), required: false });
checks.push({ label: "NEXT_PUBLIC_SUPABASE_ANON_KEY configured", warnLabel: "NEXT_PUBLIC_SUPABASE_ANON_KEY missing in .env.local", ok: Boolean(envLocal.NEXT_PUBLIC_SUPABASE_ANON_KEY), required: false });
checks.push({ label: "SUPABASE_SERVICE_ROLE_KEY configured", warnLabel: "SUPABASE_SERVICE_ROLE_KEY missing in .env.local", ok: Boolean(envLocal.SUPABASE_SERVICE_ROLE_KEY), required: false });

let hasFailure = false;
for (const check of checks) {
  const status = check.ok ? "OK" : check.required ? "FAIL" : "WARN";
  const label = check.ok ? check.label : check.warnLabel || check.label;
  console.log(`${status} ${label}`);
  if (!check.ok && check.required) hasFailure = true;
}

if (hasFailure) {
  process.exitCode = 1;
}