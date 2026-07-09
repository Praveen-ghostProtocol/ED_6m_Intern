import { createClient } from "@/lib/supabase/server";
import type {
  CompanyRole,
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

  return data as StudentRecord;
}

export async function getStudentResumes(studentId: string): Promise<StudentResume[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id,student_id,file_name,storage_path,file_size_bytes,status,verification_note,uploaded_at")
    .eq("student_id", studentId)
    .order("uploaded_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  const resumes = data as Omit<StudentResume, "signed_url">[];

  return Promise.all(
    resumes.map(async (resume) => {
      const { data: signed } = await supabase.storage
        .from("resumes")
        .createSignedUrl(resume.storage_path, 60 * 10);

      return {
        ...resume,
        signed_url: signed?.signedUrl ?? null
      };
    })
  );
}

export async function getVerifiedResumeChoices(studentId: string): Promise<VerifiedResumeChoice[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("resumes")
    .select("id,file_name,uploaded_at")
    .eq("student_id", studentId)
    .eq("status", "verified")
    .order("uploaded_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data as VerifiedResumeChoice[];
}

export async function getOpenCompanyRoles(studentId: string): Promise<CompanyRole[]> {
  const supabase = await createClient();

  const [{ data: roles }, { data: applications }] = await Promise.all([
    supabase
      .from("internship_roles")
      .select(
        "id,company_id,title,duration,location,eligibility,job_description,jd_file_name,jd_storage_path,selection_process,gd_applicable,deadline,companies(name)"
      )
      .eq("status", "open")
      .order("deadline", { ascending: true, nullsFirst: false }),
    supabase
      .from("applications")
      .select("id,role_id,resume_id,resumes(file_name)")
      .eq("student_id", studentId)
  ]);

  const applicationByRole = new Map<string, { id: string; resume_id: string; resume_file_name: string | null }>();
  (applications ?? []).forEach((application) => {
    const resume = one(application.resumes) as Record<string, unknown> | null;
    applicationByRole.set(application.role_id as string, {
      id: application.id as string,
      resume_id: application.resume_id as string,
      resume_file_name: (resume?.file_name as string | undefined) ?? null
    });
  });

  return Promise.all(
    (roles ?? []).map(async (role) => {
      const company = one(role.companies) as Record<string, unknown> | null;
      const application = applicationByRole.get(role.id as string) ?? null;
      const jdStoragePath = role.jd_storage_path as string | null;
      const signed = jdStoragePath
        ? await supabase.storage.from("job-descriptions").createSignedUrl(jdStoragePath, 60 * 10)
        : { data: null };

      return {
        id: role.id as string,
        company_id: role.company_id as string,
        company_name: (company?.name as string | undefined) ?? "Company",
        title: role.title as string,
        duration: (role.duration as string | null) ?? null,
        location: (role.location as string | null) ?? null,
        eligibility: (role.eligibility as string | null) ?? null,
        job_description: role.job_description as string,
        jd_file_name: (role.jd_file_name as string | null) ?? null,
        jd_signed_url: signed.data?.signedUrl ?? null,
        selection_process: (role.selection_process as string | null) ?? null,
        gd_applicable: Boolean(role.gd_applicable),
        deadline: (role.deadline as string | null) ?? null,
        application_id: application?.id ?? null,
        application_resume_id: application?.resume_id ?? null,
        application_resume_file_name: application?.resume_file_name ?? null,
        has_applied: Boolean(application)
      };
    })
  );
}

export async function getStudentApplications(studentId: string): Promise<StudentApplication[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("applications")
    .select(
      "id,applied_at,resume_shortlist_status,test_status,gd_status,offer_status,internship_roles(title,companies(name)),resumes(file_name)"
    )
    .eq("student_id", studentId)
    .order("applied_at", { ascending: false });

  if (error || !data) {
    return [];
  }

  return data.map((application) => {
    const role = one(application.internship_roles) as Record<string, unknown> | null;
    const company = one(role?.companies as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
    const resume = one(application.resumes) as Record<string, unknown> | null;

    return {
      id: application.id as string,
      applied_at: application.applied_at as string,
      resume_shortlist_status: application.resume_shortlist_status,
      test_status: application.test_status,
      gd_status: application.gd_status,
      offer_status: application.offer_status,
      role_title: (role?.title as string | undefined) ?? "Role",
      company_name: (company?.name as string | undefined) ?? "Company",
      resume_file_name: (resume?.file_name as string | undefined) ?? "Resume"
    } as StudentApplication;
  });
}