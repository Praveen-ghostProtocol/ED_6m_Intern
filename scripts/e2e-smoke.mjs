import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

function loadEnv(path = ".env.local") {
  const env = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    env[trimmed.slice(0, index).trim()] = trimmed.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }
  return env;
}

function readCsv(path) {
  const [header, ...rows] = readFileSync(path, "utf8").trim().split(/\r?\n/);
  const columns = header.split(",");
  return rows.map((row) => {
    const values = row.split(",");
    return Object.fromEntries(columns.map((column, index) => [column, values[index] ?? ""]));
  });
}

function client(url, key) {
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

async function signIn(url, anonKey, email, password) {
  const supabase = client(url, anonKey);
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw new Error(`Sign-in failed for ${email}: ${error.message}`);
  return supabase;
}

function assertOk(condition, message) {
  if (!condition) throw new Error(message);
}

const env = loadEnv();
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const admin = client(url, serviceKey);

const studentCred = readCsv("student-credentials.csv").find((row) => row.email === "ed23b001@smail.iitm.ac.in");
const testCreds = readCsv("test-user-credentials.csv");
const organizerCred = testCreds.find((row) => row.email === "organizer.test@ed-internships.local");
const recruiterCred = testCreds.find((row) => row.email === "recruiter.test@ed-internships.local");

assertOk(studentCred?.temporary_password, "Missing student credential for ed23b001.");
assertOk(organizerCred?.temporary_password, "Missing organizer test credential.");
assertOk(recruiterCred?.temporary_password, "Missing recruiter test credential.");


const student = await signIn(url, anonKey, studentCred.email, studentCred.temporary_password);
const { data: studentRow, error: studentError } = await student
  .from("students")
  .select("id,roll_number")
  .eq("roll_number", "ed23b001")
  .single();
if (studentError) throw studentError;

const { data: demoRoleForCleanup, error: cleanupRoleError } = await admin
  .from("internship_roles")
  .select("id")
  .eq("title", "Engineering Design Intern")
  .maybeSingle();
if (cleanupRoleError) throw cleanupRoleError;

if (demoRoleForCleanup) {
  await admin.from("applications").delete().eq("student_id", studentRow.id).eq("role_id", demoRoleForCleanup.id);
}

const { data: oldSmokeResumes, error: oldSmokeResumeError } = await admin
  .from("resumes")
  .select("id,storage_path")
  .eq("student_id", studentRow.id)
  .eq("file_name", "e2e-smoke.pdf");
if (oldSmokeResumeError) throw oldSmokeResumeError;

const oldStoragePaths = (oldSmokeResumes ?? []).map((resume) => resume.storage_path).filter(Boolean);
if (oldStoragePaths.length > 0) {
  await admin.storage.from("resumes").remove(oldStoragePaths);
  const oldResumeIds = oldSmokeResumes.map((resume) => resume.id);
  await admin.from("resumes").delete().in("id", oldResumeIds);
}

const stamp = Date.now();
const storagePath = `${studentRow.id}/${stamp}-e2e-smoke.pdf`;
const pdfBytes = new Uint8Array(Buffer.from("%PDF-1.4\n1 0 obj <<>> endobj\ntrailer <<>>\n%%EOF\n"));
const { error: uploadError } = await student.storage.from("resumes").upload(storagePath, pdfBytes, {
  contentType: "application/pdf",
  upsert: false
});
if (uploadError) throw uploadError;

const { data: resume, error: resumeError } = await student
  .from("resumes")
  .insert({
    student_id: studentRow.id,
    file_name: "e2e-smoke.pdf",
    storage_path: storagePath,
    mime_type: "application/pdf",
    file_size_bytes: pdfBytes.length,
    status: "pending"
  })
  .select("id,status")
  .single();
if (resumeError) throw resumeError;
assertOk(resume.status === "pending", "Resume should start pending.");

const organizer = await signIn(url, anonKey, organizerCred.email, organizerCred.temporary_password);
const { data: organizerProfile, error: organizerProfileError } = await organizer
  .from("profiles")
  .select("id,role")
  .eq("email", organizerCred.email)
  .single();
if (organizerProfileError) throw organizerProfileError;
assertOk(organizerProfile.role === "organizer", "Organizer profile role mismatch.");

const { data: verifiedResume, error: verifyError } = await organizer
  .from("resumes")
  .update({
    status: "verified",
    verification_note: null,
    verified_by: organizerProfile.id,
    verified_at: new Date().toISOString()
  })
  .eq("id", resume.id)
  .select("id,status")
  .single();
if (verifyError) throw verifyError;
assertOk(verifiedResume.status === "verified", "Organizer could not verify resume.");

const { data: role, error: roleError } = await student
  .from("internship_roles")
  .select("id,title,status,gd_applicable")
  .eq("title", "Engineering Design Intern")
  .eq("status", "open")
  .single();
if (roleError) throw roleError;

const { data: application, error: applicationError } = await student
  .from("applications")
  .insert({
    student_id: studentRow.id,
    role_id: role.id,
    resume_id: resume.id,
    gd_status: role.gd_applicable ? "pending" : "not_applicable"
  })
  .select("id,resume_shortlist_status,test_status,gd_status,offer_status")
  .single();
if (applicationError) throw applicationError;

const recruiter = await signIn(url, anonKey, recruiterCred.email, recruiterCred.temporary_password);
const { data: recruiterProfile, error: recruiterProfileError } = await recruiter
  .from("profiles")
  .select("id,role")
  .eq("email", recruiterCred.email)
  .single();
if (recruiterProfileError) throw recruiterProfileError;
assertOk(recruiterProfile.role === "recruiter", "Recruiter profile role mismatch.");

const { data: recruiterApplication, error: recruiterReadError } = await recruiter
  .from("applications")
  .select("id,role_id,resume_shortlist_status,test_status,gd_status,offer_status")
  .eq("id", application.id)
  .single();
if (recruiterReadError) throw recruiterReadError;
assertOk(recruiterApplication.id === application.id, "Recruiter could not read assigned application.");

const { data: updatedApplication, error: recruiterUpdateError } = await recruiter
  .from("applications")
  .update({
    resume_shortlist_status: "shortlisted",
    test_status: "shortlisted",
    gd_status: "selected",
    offer_status: "offer_given"
  })
  .eq("id", application.id)
  .select("resume_shortlist_status,test_status,gd_status,offer_status")
  .single();
if (recruiterUpdateError) throw recruiterUpdateError;

const historyRows = [
  ["resume_shortlist_status", recruiterApplication.resume_shortlist_status, "shortlisted"],
  ["test_status", recruiterApplication.test_status, "shortlisted"],
  ["gd_status", recruiterApplication.gd_status, "selected"],
  ["offer_status", recruiterApplication.offer_status, "offer_given"]
].map(([field_name, old_status, new_status]) => ({
  application_id: application.id,
  changed_by: recruiterProfile.id,
  field_name,
  old_status,
  new_status
}));
const { error: historyError } = await recruiter.from("status_history").insert(historyRows);
if (historyError) throw historyError;

const { data: studentView, error: studentViewError } = await student
  .from("applications")
  .select("id,resume_shortlist_status,test_status,gd_status,offer_status")
  .eq("id", application.id)
  .single();
if (studentViewError) throw studentViewError;
assertOk(studentView.offer_status === "offer_given", "Student could not see updated offer status.");

console.log(JSON.stringify({
  student: studentCred.email,
  resumeStatus: verifiedResume.status,
  applicationId: application.id,
  recruiterCanReadAssignedApplication: true,
  finalStatuses: updatedApplication,
  studentCanSeeFinalStatus: studentView.offer_status
}, null, 2));