import { defaultRecruiterEmail, requireSupabaseAdmin } from "./provision-lib.mjs";

const supabase = requireSupabaseAdmin();

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
  const { data: existing, error: selectError } = await supabase
    .from("internship_roles")
    .select("id")
    .eq("company_id", companyId)
    .eq("title", "Engineering Design Intern")
    .maybeSingle();
  if (selectError) throw selectError;
  if (existing) return existing.id;

  const { data, error } = await supabase
    .from("internship_roles")
    .insert({
      company_id: companyId,
      title: "Engineering Design Intern",
      duration: "6 months",
      stipend: "25000/month",
      location: "Chennai / Hybrid",
      eligibility: "Engineering Design students only.",
      job_description: "Demo role for validating student applications, resume review, and recruiter shortlist updates.",
      selection_process: "Resume shortlist, test, group discussion, final offer.",
      gd_applicable: true,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      status: "open"
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id;
}

async function getRecruiterProfileId() {
  const { data, error } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", defaultRecruiterEmail)
    .eq("role", "recruiter")
    .maybeSingle();
  if (error) throw error;
  if (!data) throw new Error(`Run npm.cmd run provision:test-users before demo data. Missing ${defaultRecruiterEmail}.`);
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

const companyId = await upsertCompany();
const roleId = await upsertRole(companyId);
const recruiterProfileId = await getRecruiterProfileId();
const recruiterId = await upsertRecruiter(recruiterProfileId, companyId);

const { error: assignmentError } = await supabase
  .from("recruiter_role_assignments")
  .upsert({ recruiter_id: recruiterId, role_id: roleId }, { onConflict: "recruiter_id,role_id" });
if (assignmentError) throw assignmentError;

console.log(JSON.stringify({ companyId, roleId, recruiterId, recruiterEmail: defaultRecruiterEmail }, null, 2));