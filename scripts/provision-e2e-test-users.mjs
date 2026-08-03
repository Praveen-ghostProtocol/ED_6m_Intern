import {
  createOrResetAuthUser,
  defaultOrganizerEmail,
  defaultRecruiterEmail,
  defaultVerifierEmail,
  listAllAuthUsers,
  printCredentialHeader,
  printCredentialRow,
  requireSupabaseAdmin,
  temporaryPassword
} from "./provision-lib.mjs";

const supabase = requireSupabaseAdmin();
const defaultStudentEmail = "student.test@ed-internships.local";
const testUsers = [
  { email: defaultStudentEmail, role: "student", fullName: "Student Test", linkedRecord: "ed23test" },
  { email: defaultRecruiterEmail, role: "recruiter", fullName: "Recruiter Test", linkedRecord: "ED Demo Company" },
  { email: defaultVerifierEmail, role: "verifier", fullName: "Verifier Test", linkedRecord: "ed23test" },
  { email: defaultOrganizerEmail, role: "organizer", fullName: "Organizer Test", linkedRecord: "Organizer Test" }
];

async function upsertProfile({ id, email, role, fullName }) {
  const { error } = await supabase.from("profiles").upsert(
    {
      id,
      email,
      role,
      full_name: fullName,
      must_change_password: false,
      is_active: true
    },
    { onConflict: "id" }
  );

  if (error) throw error;
}

async function upsertStudent(profileId) {
  const { error } = await supabase.from("students").upsert(
    {
      profile_id: profileId,
      roll_number: "ed23test",
      cgpa: 8.5,
      phone: "9000000000",
      alternate_phone: "9000000001",
      alternate_email: "student.test.alt@ed-internships.local",
      date_of_birth: "2005-01-01",
      gender: "Prefer not to say",
      current_address_pincode: "600036",
      current_address: "Engineering Design test address",
      permanent_address_pincode: "600036",
      permanent_address: "Engineering Design test address",
      branch: "Engineering Design",
      branch_specialisation: "Automotive",
      profile_completed_at: new Date().toISOString()
    },
    { onConflict: "profile_id" }
  );
  if (error) throw error;

  const { data, error: selectError } = await supabase
    .from("students")
    .select("id")
    .eq("profile_id", profileId)
    .single();
  if (selectError) throw selectError;
  return data.id;
}

async function upsertCompany() {
  const { data: existing, error: selectError } = await supabase
    .from("companies")
    .select("id")
    .eq("name", "ED Demo Company")
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("companies")
    .insert({ name: "ED Demo Company", description: "Demo company for end-to-end portal validation." })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertRole(companyId) {
  const roleValues = {
    duration: "6 months",
    stipend: "25000/month",
    location: "Chennai / Hybrid",
    eligibility: "Engineering Design students only.",
    job_description: "Demo role for validating student applications, resume review, and company shortlist updates.",
    selection_process: "Resume shortlist, test, group discussion, final offer.",
    gd_applicable: true,
    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    status: "open"
  };

  const { data: existing, error: selectError } = await supabase
    .from("internship_roles")
    .select("id")
    .eq("company_id", companyId)
    .eq("title", "Engineering Design Intern")
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) {
    const { error } = await supabase.from("internship_roles").update(roleValues).eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase
    .from("internship_roles")
    .insert({ company_id: companyId, title: "Engineering Design Intern", ...roleValues })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertRecruiter(profileId, companyId) {
  const { data: existing, error: selectError } = await supabase
    .from("recruiters")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) {
    const { error } = await supabase
      .from("recruiters")
      .update({ company_id: companyId, designation: "Demo Recruiter" })
      .eq("id", existing.id);
    if (error) throw error;
    return existing.id;
  }

  const { data, error } = await supabase
    .from("recruiters")
    .insert({ profile_id: profileId, company_id: companyId, designation: "Demo Recruiter" })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function upsertTestApplication({ studentId, roleId, organizerProfileId }) {
  const storagePath = `${studentId}/e2e-test-resume.pdf`;
  const { data: existingResume, error: resumeSelectError } = await supabase
    .from("resumes")
    .select("id")
    .eq("storage_path", storagePath)
    .maybeSingle();
  if (resumeSelectError) throw resumeSelectError;

  let resumeId = existingResume?.id;
  if (resumeId) {
    const { error } = await supabase
      .from("resumes")
      .update({
        file_name: "e2e-test-resume.pdf",
        mime_type: "application/pdf",
        file_size_bytes: 1024,
        status: "verified",
        verification_note: "E2E test resume row.",
        verified_by: organizerProfileId,
        verified_at: new Date().toISOString()
      })
      .eq("id", resumeId);
    if (error) throw error;
  } else {
    const { data, error } = await supabase
      .from("resumes")
      .insert({
        student_id: studentId,
        file_name: "e2e-test-resume.pdf",
        storage_path: storagePath,
        mime_type: "application/pdf",
        file_size_bytes: 1024,
        status: "verified",
        verification_note: "E2E test resume row.",
        verified_by: organizerProfileId,
        verified_at: new Date().toISOString()
      })
      .select("id")
      .single();
    if (error) throw error;
    resumeId = data.id;
  }

  const { error: applicationError } = await supabase.from("applications").upsert(
    {
      student_id: studentId,
      role_id: roleId,
      resume_id: resumeId,
      resume_shortlist_status: "pending",
      test_attended: null,
      test_status: "pending",
      gd_status: "pending",
      offer_status: "pending"
    },
    { onConflict: "student_id,role_id" }
  );
  if (applicationError) throw applicationError;
}

async function upsertVerifierAssignment({ studentId, verifierProfileId, organizerProfileId }) {
  const { error } = await supabase
    .from("student_verifier_assignments")
    .upsert(
      { student_id: studentId, verifier_profile_id: verifierProfileId, assigned_by: organizerProfileId },
      { onConflict: "student_id" }
    );
  if (error) throw error;
}

async function upsertMasterResumeEntry(studentId) {
  const { data: existing, error: selectError } = await supabase
    .from("master_resume_entries")
    .select("id")
    .eq("student_id", studentId)
    .eq("title", "E2E Master Resume Entry")
    .maybeSingle();
  if (selectError) throw selectError;

  const values = {
    student_id: studentId,
    title: "E2E Master Resume Entry",
    description: "Designed a fixture entry for verifier and organizer review automation.",
    link: "https://example.com/e2e-master-resume",
    status: "pending",
    verification_note: null,
    verified_by: null,
    verified_at: null
  };

  if (existing) {
    const { error } = await supabase.from("master_resume_entries").update(values).eq("id", existing.id);
    if (error) throw error;
    return;
  }

  const { error } = await supabase.from("master_resume_entries").insert(values);
  if (error) throw error;
}

const users = await listAllAuthUsers(supabase);
const userIndex = new Map(users.map((user) => [user.email?.toLowerCase(), user]).filter(([email]) => Boolean(email)));
const credentials = [];
let recruiterProfileId = null;
let studentId = null;
let organizerProfileId = null;
let verifierProfileId = null;

for (const testUser of testUsers) {
  const password = temporaryPassword();
  const { user, created, passwordReset } = await createOrResetAuthUser(supabase, userIndex, {
    email: testUser.email,
    password,
    role: testUser.role
  });

  await upsertProfile({ id: user.id, email: testUser.email, role: testUser.role, fullName: testUser.fullName });

  if (testUser.role === "student") {
    studentId = await upsertStudent(user.id);
  }

  if (testUser.role === "recruiter") {
    recruiterProfileId = user.id;
  }

  if (testUser.role === "organizer") {
    organizerProfileId = user.id;
  }

  if (testUser.role === "verifier") {
    verifierProfileId = user.id;
  }

  credentials.push({
    email: testUser.email,
    role: testUser.role,
    password,
    linkedRecord: testUser.linkedRecord,
    status: created ? "created" : passwordReset ? "existing_password_reset" : "existing"
  });
}

if (!recruiterProfileId) throw new Error("Recruiter profile was not created.");
if (!studentId) throw new Error("Student profile was not created.");
if (!organizerProfileId) throw new Error("Organizer profile was not created.");
if (!verifierProfileId) throw new Error("Verifier profile was not created.");

const companyId = await upsertCompany();
const roleId = await upsertRole(companyId);
const recruiterId = await upsertRecruiter(recruiterProfileId, companyId);

const { error: assignmentError } = await supabase
  .from("recruiter_role_assignments")
  .upsert({ recruiter_id: recruiterId, role_id: roleId }, { onConflict: "recruiter_id,role_id" });
if (assignmentError) throw assignmentError;

await upsertTestApplication({ studentId, roleId, organizerProfileId });
await upsertVerifierAssignment({ studentId, verifierProfileId, organizerProfileId });
await upsertMasterResumeEntry(studentId);

printCredentialHeader();
for (const credential of credentials) {
  printCredentialRow(credential);
}