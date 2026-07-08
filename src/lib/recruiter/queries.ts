import { createClient } from "@/lib/supabase/server";
import type {
  RecruiterApplication,
  RecruiterDashboardStats,
  RecruiterProfile,
  RecruiterRole
} from "@/types/recruiter";

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function isPendingDecision(application: RecruiterApplication) {
  return (
    application.resume_shortlist_status === "pending" ||
    application.test_status === "pending" ||
    application.offer_status === "pending" ||
    (application.gd_applicable && application.gd_status === "pending")
  );
}

export async function getRecruiterByProfileId(profileId: string): Promise<RecruiterProfile | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("recruiters")
    .select("id,profile_id,designation,company_id,profiles(email,full_name,is_active),companies(name)")
    .eq("profile_id", profileId)
    .single();

  if (error || !data) {
    return null;
  }

  const profile = one(data.profiles) as Record<string, unknown> | null;
  const company = one(data.companies) as Record<string, unknown> | null;

  return {
    id: data.id as string,
    profile_id: data.profile_id as string,
    email: (profile?.email as string | undefined) ?? "",
    full_name: (profile?.full_name as string | null | undefined) ?? null,
    company_id: data.company_id as string,
    company_name: (company?.name as string | undefined) ?? "Company",
    designation: (data.designation as string | null) ?? null,
    is_active: Boolean(profile?.is_active)
  };
}

export async function getAssignedRolesForRecruiter(recruiterId: string): Promise<RecruiterRole[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("recruiter_role_assignments")
    .select("role_id,internship_roles(id,company_id,title,duration,stipend,location,deadline,gd_applicable,status,companies(name))")
    .eq("recruiter_id", recruiterId)
    .order("created_at", { ascending: false });

  return (data ?? []).map((assignment) => {
    const role = one(assignment.internship_roles) as Record<string, unknown> | null;
    const company = one(role?.companies as Record<string, unknown> | Record<string, unknown>[] | null | undefined);

    return {
      id: (role?.id as string | undefined) ?? (assignment.role_id as string),
      company_id: (role?.company_id as string | undefined) ?? "",
      company_name: (company?.name as string | undefined) ?? "Company",
      title: (role?.title as string | undefined) ?? "Role",
      duration: (role?.duration as string | null | undefined) ?? null,
      stipend: (role?.stipend as string | null | undefined) ?? null,
      location: (role?.location as string | null | undefined) ?? null,
      deadline: (role?.deadline as string | null | undefined) ?? null,
      gd_applicable: Boolean(role?.gd_applicable),
      status: (role?.status as RecruiterRole["status"] | undefined) ?? "draft"
    };
  });
}

export async function getApplicationsForRecruiter(recruiterId: string): Promise<RecruiterApplication[]> {
  const supabase = await createClient();
  const assignedRoles = await getAssignedRolesForRecruiter(recruiterId);
  const roleIds = assignedRoles.map((role) => role.id);

  if (roleIds.length === 0) {
    return [];
  }

  const { data } = await supabase
    .from("applications")
    .select("id,role_id,applied_at,resume_shortlist_status,test_status,gd_status,offer_status,students(roll_number,cgpa,profiles(email,full_name)),internship_roles(title,gd_applicable,companies(name)),resumes(file_name,storage_path)")
    .in("role_id", roleIds)
    .order("applied_at", { ascending: false });

  return Promise.all(
    (data ?? []).map(async (application) => {
      const student = one(application.students) as Record<string, unknown> | null;
      const profile = one(student?.profiles as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
      const role = one(application.internship_roles) as Record<string, unknown> | null;
      const company = one(role?.companies as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
      const resume = one(application.resumes) as Record<string, unknown> | null;
      const storagePath = resume?.storage_path as string | undefined;
      const signed = storagePath
        ? await supabase.storage.from("resumes").createSignedUrl(storagePath, 60 * 10)
        : { data: null };

      return {
        id: application.id as string,
        student_roll_number: (student?.roll_number as string | undefined) ?? "",
        student_email: (profile?.email as string | undefined) ?? "",
        student_name: (profile?.full_name as string | null | undefined) ?? null,
        student_cgpa: (student?.cgpa as number | null | undefined) ?? null,
        company_name: (company?.name as string | undefined) ?? "Company",
        role_id: application.role_id as string,
        role_title: (role?.title as string | undefined) ?? "Role",
        resume_file_name: (resume?.file_name as string | undefined) ?? "Resume",
        resume_signed_url: signed.data?.signedUrl ?? null,
        applied_at: application.applied_at as string,
        gd_applicable: Boolean(role?.gd_applicable),
        resume_shortlist_status: application.resume_shortlist_status as RecruiterApplication["resume_shortlist_status"],
        test_status: application.test_status as RecruiterApplication["test_status"],
        gd_status: application.gd_status as RecruiterApplication["gd_status"],
        offer_status: application.offer_status as RecruiterApplication["offer_status"]
      };
    })
  );
}

export async function getRecruiterDashboardStats(recruiterId: string): Promise<RecruiterDashboardStats> {
  const [roles, applications] = await Promise.all([
    getAssignedRolesForRecruiter(recruiterId),
    getApplicationsForRecruiter(recruiterId)
  ]);

  return {
    assignedRoles: roles.length,
    applicants: applications.length,
    pendingDecisions: applications.filter(isPendingDecision).length
  };
}