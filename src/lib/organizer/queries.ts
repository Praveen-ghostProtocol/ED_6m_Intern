import { createClient } from "@/lib/supabase/server";
import type {
  OrganizerApplication,
  OrganizerCompany,
  OrganizerDashboardStats,
  OrganizerRecruiter,
  OrganizerReportRow,
  OrganizerResume,
  OrganizerRole,
  OrganizerStudent
} from "@/types/organizer";

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export async function getOrganizerDashboardStats(): Promise<OrganizerDashboardStats> {
  const supabase = await createClient();
  const [students, companies, roles, applications, pendingResumes, offers] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }),
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("internship_roles").select("id", { count: "exact", head: true }),
    supabase.from("applications").select("id", { count: "exact", head: true }),
    supabase.from("resumes").select("id", { count: "exact", head: true }).eq("status", "pending"),
    supabase.from("applications").select("id", { count: "exact", head: true }).eq("offer_status", "offer_given")
  ]);

  return {
    students: students.count ?? 0,
    companies: companies.count ?? 0,
    roles: roles.count ?? 0,
    applications: applications.count ?? 0,
    pendingResumes: pendingResumes.count ?? 0,
    offers: offers.count ?? 0
  };
}

export async function getStudentsForOrganizer(): Promise<OrganizerStudent[]> {
  const supabase = await createClient();
  const [{ data: students }, { data: resumes }, { data: applications }] = await Promise.all([
    supabase
      .from("students")
      .select("id,roll_number,cgpa,branch,profiles(email,full_name,is_active,must_change_password)")
      .order("roll_number", { ascending: true }),
    supabase.from("resumes").select("student_id"),
    supabase.from("applications").select("student_id")
  ]);

  const resumeCounts = new Map<string, number>();
  const applicationCounts = new Map<string, number>();
  (resumes ?? []).forEach((resume) => increment(resumeCounts, resume.student_id as string));
  (applications ?? []).forEach((application) => increment(applicationCounts, application.student_id as string));

  return (students ?? []).map((student) => {
    const profile = one(student.profiles) as Record<string, unknown> | null;

    return {
      id: student.id as string,
      roll_number: student.roll_number as string,
      email: (profile?.email as string | undefined) ?? "",
      full_name: (profile?.full_name as string | null | undefined) ?? null,
      cgpa: (student.cgpa as number | null) ?? null,
      branch: student.branch as string,
      is_active: Boolean(profile?.is_active),
      must_change_password: Boolean(profile?.must_change_password),
      resume_count: resumeCounts.get(student.id as string) ?? 0,
      application_count: applicationCounts.get(student.id as string) ?? 0
    };
  });
}

export async function getPendingResumesForOrganizer(): Promise<OrganizerResume[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("resumes")
    .select("id,student_id,file_name,storage_path,file_size_bytes,status,verification_note,uploaded_at,students(roll_number,profiles(email,full_name))")
    .eq("status", "pending")
    .order("uploaded_at", { ascending: true });

  const resumes = data ?? [];

  return Promise.all(
    resumes.map(async (resume) => {
      const student = one(resume.students) as Record<string, unknown> | null;
      const profile = one(student?.profiles as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
      const { data: signed } = await supabase.storage
        .from("resumes")
        .createSignedUrl(resume.storage_path as string, 60 * 10);

      return {
        id: resume.id as string,
        student_id: resume.student_id as string,
        file_name: resume.file_name as string,
        storage_path: resume.storage_path as string,
        file_size_bytes: resume.file_size_bytes as number,
        status: resume.status as OrganizerResume["status"],
        verification_note: (resume.verification_note as string | null) ?? null,
        uploaded_at: resume.uploaded_at as string,
        signed_url: signed?.signedUrl ?? null,
        student_roll_number: (student?.roll_number as string | undefined) ?? "",
        student_email: (profile?.email as string | undefined) ?? "",
        student_name: (profile?.full_name as string | null | undefined) ?? null
      };
    })
  );
}

export async function getCompaniesForOrganizer(): Promise<OrganizerCompany[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("companies")
    .select("id,name,description")
    .order("name", { ascending: true });

  return (data ?? []).map((company) => ({
    id: company.id as string,
    name: company.name as string,
    description: (company.description as string | null) ?? null
  }));
}

export async function getRolesForOrganizer(): Promise<OrganizerRole[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("internship_roles")
    .select("id,company_id,title,duration,stipend,location,deadline,gd_applicable,status,companies(name)")
    .order("created_at", { ascending: false });

  return (data ?? []).map((role) => {
    const company = one(role.companies) as Record<string, unknown> | null;

    return {
      id: role.id as string,
      company_id: role.company_id as string,
      company_name: (company?.name as string | undefined) ?? "Company",
      title: role.title as string,
      duration: (role.duration as string | null) ?? null,
      stipend: (role.stipend as string | null) ?? null,
      location: (role.location as string | null) ?? null,
      deadline: (role.deadline as string | null) ?? null,
      gd_applicable: Boolean(role.gd_applicable),
      status: role.status as OrganizerRole["status"]
    };
  });
}

export async function getAllApplicationsForOrganizer(): Promise<OrganizerApplication[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("applications")
    .select("id,applied_at,resume_shortlist_status,test_status,gd_status,offer_status,students(roll_number,profiles(email,full_name)),internship_roles(title,gd_applicable,companies(name)),resumes(file_name)")
    .order("applied_at", { ascending: false });

  return (data ?? []).map((application) => {
    const student = one(application.students) as Record<string, unknown> | null;
    const profile = one(student?.profiles as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
    const role = one(application.internship_roles) as Record<string, unknown> | null;
    const company = one(role?.companies as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
    const resume = one(application.resumes) as Record<string, unknown> | null;

    return {
      id: application.id as string,
      student_roll_number: (student?.roll_number as string | undefined) ?? "",
      student_email: (profile?.email as string | undefined) ?? "",
      student_name: (profile?.full_name as string | null | undefined) ?? null,
      company_name: (company?.name as string | undefined) ?? "Company",
      role_title: (role?.title as string | undefined) ?? "Role",
      resume_file_name: (resume?.file_name as string | undefined) ?? "Resume",
      applied_at: application.applied_at as string,
      gd_applicable: Boolean(role?.gd_applicable),
      resume_shortlist_status: application.resume_shortlist_status as OrganizerApplication["resume_shortlist_status"],
      test_status: application.test_status as OrganizerApplication["test_status"],
      gd_status: application.gd_status as OrganizerApplication["gd_status"],
      offer_status: application.offer_status as OrganizerApplication["offer_status"]
    };
  });
}

export async function getRecruitersForOrganizer(): Promise<OrganizerRecruiter[]> {
  const supabase = await createClient();
  const [{ data: recruiters }, { data: assignments }] = await Promise.all([
    supabase
      .from("recruiters")
      .select("id,profile_id,designation,company_id,profiles(email,full_name),companies(name)")
      .order("created_at", { ascending: false }),
    supabase.from("recruiter_role_assignments").select("recruiter_id,internship_roles(title)")
  ]);

  const assignmentMap = new Map<string, string[]>();
  (assignments ?? []).forEach((assignment) => {
    const role = one(assignment.internship_roles) as Record<string, unknown> | null;
    const recruiterId = assignment.recruiter_id as string;
    const titles = assignmentMap.get(recruiterId) ?? [];
    titles.push((role?.title as string | undefined) ?? "Role");
    assignmentMap.set(recruiterId, titles);
  });

  return (recruiters ?? []).map((recruiter) => {
    const profile = one(recruiter.profiles) as Record<string, unknown> | null;
    const company = one(recruiter.companies) as Record<string, unknown> | null;

    return {
      id: recruiter.id as string,
      profile_id: recruiter.profile_id as string,
      email: (profile?.email as string | undefined) ?? "",
      full_name: (profile?.full_name as string | null | undefined) ?? null,
      company_id: recruiter.company_id as string,
      company_name: (company?.name as string | undefined) ?? "Company",
      designation: (recruiter.designation as string | null) ?? null,
      assigned_roles: assignmentMap.get(recruiter.id as string) ?? []
    };
  });
}

export async function getReportsForOrganizer(): Promise<OrganizerReportRow[]> {
  const applications = await getAllApplicationsForOrganizer();
  const rows = new Map<string, OrganizerReportRow>();

  applications.forEach((application) => {
    const key = `${application.company_name}::${application.role_title}`;
    const row = rows.get(key) ?? {
      company_name: application.company_name,
      role_title: application.role_title,
      application_count: 0,
      resume_shortlists: 0,
      test_shortlists: 0,
      gd_shortlists: 0,
      offers: 0
    };

    row.application_count += 1;
    if (application.resume_shortlist_status === "shortlisted") row.resume_shortlists += 1;
    if (application.test_status === "shortlisted") row.test_shortlists += 1;
    if (application.gd_status === "shortlisted") row.gd_shortlists += 1;
    if (application.offer_status === "offer_given") row.offers += 1;
    rows.set(key, row);
  });

  return Array.from(rows.values()).sort((a, b) => b.application_count - a.application_count);
}