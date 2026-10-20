import { createClient } from "@/lib/supabase/server";
import { isStudentApplicationLockedByRoll } from "@/lib/students/application-locks";
import { getStudentStipendBand } from "@/lib/student/stipend-band";
import { getSignedUrlMap } from "@/lib/supabase/signed-urls";
import type {
  CompanyRole,
  MasterResumeEntry,
  StudentApplication,
  StudentRecord,
  StudentResume,
  VerifiedResumeChoice
} from "@/types/student";

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

export async function getStudentByProfileId(profileId: string): Promise<StudentRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("students")
    .select("id,profile_id,roll_number,cgpa,phone,alternate_phone,alternate_email,date_of_birth,gender,current_address_pincode,current_address,permanent_address_pincode,permanent_address,branch,branch_specialisation,profile_completed_at")
    .eq("profile_id", profileId)
    .single();

  if (error || !data) {
    return null;
  }

  const { count } = await supabase
    .from("applications")
    .select("id", { count: "exact", head: true })
    .eq("student_id", data.id)
    .eq("offer_status", "offer_given");

  return {
    ...data,
    has_offer: (count ?? 0) > 0,
    application_locked: isStudentApplicationLockedByRoll(data.roll_number) || (count ?? 0) > 0
  } as StudentRecord;
}

export async function getStudentResumes(studentId: string): Promise<StudentResume[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id,student_id,file_name,storage_path,file_size_bytes,status,verification_note,uploaded_at,removed_at")
    .eq("student_id", studentId)
    .is("removed_at", null)
    .order("uploaded_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const resumes = data as Omit<StudentResume, "signed_url">[];

  const signedUrls = await getSignedUrlMap(supabase, "resumes", resumes.map((resume) => resume.storage_path));
  return resumes.map((resume) => ({ ...resume, signed_url: signedUrls.get(resume.storage_path) ?? null }));
}

export async function getVerifiedResumeChoices(studentId: string): Promise<VerifiedResumeChoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id,file_name,uploaded_at")
    .eq("student_id", studentId)
    .eq("status", "verified")
    .is("removed_at", null)
    .order("uploaded_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as VerifiedResumeChoice[];
}

export async function getStudentDashboardStats(studentId: string) {
  const supabase = await createClient();
  const [resumes, roles, applications] = await Promise.all([
    supabase.from("resumes").select("id", { count: "exact", head: true }).eq("student_id", studentId).eq("status", "verified").is("removed_at", null),
    supabase.from("internship_roles").select("id", { count: "exact", head: true }).eq("status", "open"),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("student_id", studentId)
  ]);

  return {
    verifiedResumes: resumes.count ?? 0,
    openRoles: roles.count ?? 0,
    applications: applications.count ?? 0
  };
}

export async function getOpenCompanyRoles(studentId: string): Promise<CompanyRole[]> {
  const supabase = await createClient();

  const [{ data: roles }, { data: applications }] = await Promise.all([
    supabase
      .from("internship_roles")
      .select(
        "id,company_id,title,status,duration,stipend,location,eligibility,job_description,jd_file_name,jd_storage_path,selection_process,gd_applicable,deadline,companies(name)"
      )
      .in("status", ["open", "closed"])
      .order("deadline", { ascending: true, nullsFirst: false }),
    supabase
      .from("applications")
      .select("id,role_id,resume_id,active_backlog,resumes(file_name)")
      .eq("student_id", studentId)
  ]);

  const applicationByRole = new Map<string, { id: string; resume_id: string; resume_file_name: string | null; active_backlog: boolean | null }>();
  (applications ?? []).forEach((application) => {
    const resume = one(application.resumes) as Record<string, unknown> | null;
    applicationByRole.set(application.role_id as string, {
      id: application.id as string,
      resume_id: application.resume_id as string,
      resume_file_name: (resume?.file_name as string | undefined) ?? null,
      active_backlog: (application.active_backlog as boolean | null) ?? null
    });
  });

  const signedUrls = await getSignedUrlMap(supabase, "job-descriptions", (roles ?? []).map((role) => role.jd_storage_path as string | null));
  return (roles ?? []).map((role) => {
      const company = one(role.companies) as Record<string, unknown> | null;
      const application = applicationByRole.get(role.id as string) ?? null;
      const jdStoragePath = role.jd_storage_path as string | null;

      return {
        id: role.id as string,
        company_id: role.company_id as string,
        company_name: (company?.name as string | undefined) ?? "Company",
        title: role.title as string,
        status: role.status as CompanyRole["status"],
        duration: (role.duration as string | null) ?? null,
        stipend_band: getStudentStipendBand(role.stipend as string | null),
        location: (role.location as string | null) ?? null,
        eligibility: (role.eligibility as string | null) ?? null,
        job_description: role.job_description as string,
        jd_file_name: (role.jd_file_name as string | null) ?? null,
        jd_signed_url: jdStoragePath ? signedUrls.get(jdStoragePath) ?? null : null,
        selection_process: (role.selection_process as string | null) ?? null,
        gd_applicable: Boolean(role.gd_applicable),
        deadline: (role.deadline as string | null) ?? null,
        application_id: application?.id ?? null,
        application_resume_id: application?.resume_id ?? null,
        application_resume_file_name: application?.resume_file_name ?? null,
        application_active_backlog: application?.active_backlog ?? null,
        has_applied: Boolean(application)
      };
    });
}

export async function getStudentApplications(studentId: string): Promise<StudentApplication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id,applied_at,resume_shortlist_status,test_attended,test_status,gd_status,offer_status,internship_roles(title,stipend,job_description,jd_file_name,jd_storage_path,selection_process,companies(name)),resumes(file_name)"
    )
    .eq("student_id", studentId)
    .order("applied_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const signedUrls = await getSignedUrlMap(supabase, "job-descriptions", data.map((application) => {
    const role = one(application.internship_roles) as Record<string, unknown> | null;
    return role?.jd_storage_path as string | null | undefined;
  }));
  return data.map((application) => {
    const role = one(application.internship_roles) as Record<string, unknown> | null;
    const company = one(role?.companies as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
    const resume = one(application.resumes) as Record<string, unknown> | null;
    const jdStoragePath = role?.jd_storage_path as string | null | undefined;

    return {
      id: application.id as string,
      applied_at: application.applied_at as string,
      resume_shortlist_status: application.resume_shortlist_status,
      test_attended: (application.test_attended as boolean | null) ?? null,
      test_status: application.test_status,
      gd_status: application.gd_status,
      offer_status: application.offer_status,
      role_title: (role?.title as string | undefined) ?? "Role",
      company_name: (company?.name as string | undefined) ?? "Company",
      stipend_band: getStudentStipendBand(role?.stipend as string | null | undefined),
      resume_file_name: (resume?.file_name as string | undefined) ?? "Resume",
      job_description: (role?.job_description as string | null | undefined) ?? null,
      jd_file_name: (role?.jd_file_name as string | null | undefined) ?? null,
      jd_signed_url: jdStoragePath ? signedUrls.get(jdStoragePath) ?? null : null,
      selection_process: (role?.selection_process as string | null | undefined) ?? null
    } as StudentApplication;
  });
}
export async function getStudentMasterResumeEntries(studentId: string): Promise<MasterResumeEntry[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("master_resume_entries")
    .select("id,student_id,title,description,link,status,verification_note,verified_at,created_at,updated_at")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as MasterResumeEntry[];
}
