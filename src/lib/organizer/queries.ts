import { randomBytes } from "node:crypto";
import { createClient } from "@/lib/supabase/server";
import { embeddedProfileIsActive, embeddedStudentIsActive, getActiveStudentIds } from "@/lib/students/active";
import type {
  OrganizerApplication,
  OrganizerCompany,
  OrganizerDashboardStats,
  OrganizerMasterResumeEntry,
  OrganizerRecruiter,
  OrganizerReportRow,
  OrganizerResume,
  OrganizerRole,
  OrganizerStudent,
  OrganizerVerifier,
  OrganizerVerifierAssignment,
  OrganizerVerificationItem
} from "@/types/organizer";

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

function resumeSharePath(token: string) {
  return `/resume/share/${token}`;
}

async function getOrCreateResumeSharePath(supabase: SupabaseServerClient, applicationId: string, resumeId: string | null) {
  if (!resumeId) return null;

  const { data: existing } = await supabase
    .from("resume_share_links")
    .select("token,is_active")
    .eq("application_id", applicationId)
    .eq("resume_id", resumeId)
    .maybeSingle();

  if (existing?.token) {
    return existing.is_active === false ? null : resumeSharePath(existing.token as string);
  }

  const token = randomBytes(32).toString("base64url");
  const { data: inserted } = await supabase
    .from("resume_share_links")
    .insert({
      application_id: applicationId,
      resume_id: resumeId,
      token,
      is_active: true
    })
    .select("token")
    .single();

  if (inserted?.token) {
    return resumeSharePath(inserted.token as string);
  }

  const { data: retried } = await supabase
    .from("resume_share_links")
    .select("token,is_active")
    .eq("application_id", applicationId)
    .eq("resume_id", resumeId)
    .maybeSingle();

  if (retried?.token) {
    return retried.is_active === false ? null : resumeSharePath(retried.token as string);
  }

  return null;
}

export async function getOrganizerDashboardStats(): Promise<OrganizerDashboardStats> {
  const supabase = await createClient();
  const activeStudentIds = await getActiveStudentIds(supabase);
  const [companies, roles, applications, pendingResumes, offers] = await Promise.all([
    supabase.from("companies").select("id", { count: "exact", head: true }),
    supabase.from("internship_roles").select("id", { count: "exact", head: true }),
    activeStudentIds.length > 0
      ? supabase.from("applications").select("id", { count: "exact", head: true }).in("student_id", activeStudentIds)
      : Promise.resolve({ count: 0 }),
    activeStudentIds.length > 0
      ? supabase.from("resumes").select("id", { count: "exact", head: true }).in("student_id", activeStudentIds).eq("status", "pending").is("removed_at", null)
      : Promise.resolve({ count: 0 }),
    activeStudentIds.length > 0
      ? supabase.from("applications").select("id", { count: "exact", head: true }).in("student_id", activeStudentIds).eq("offer_status", "offer_given")
      : Promise.resolve({ count: 0 })
  ]);

  return {
    students: activeStudentIds.length,
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
      .select("id,roll_number,cgpa,branch,branch_specialisation,profile_completed_at,profiles(email,full_name,is_active,must_change_password)")
      .order("roll_number", { ascending: true }),
    supabase.from("resumes").select("student_id").is("removed_at", null),
    supabase.from("applications").select("student_id")
  ]);

  const resumeCounts = new Map<string, number>();
  const applicationCounts = new Map<string, number>();
  (resumes ?? []).forEach((resume) => increment(resumeCounts, resume.student_id as string));
  (applications ?? []).forEach((application) => increment(applicationCounts, application.student_id as string));

  return (students ?? []).filter((student) => embeddedProfileIsActive(student.profiles)).map((student) => {
    const profile = one(student.profiles) as Record<string, unknown> | null;

    return {
      id: student.id as string,
      roll_number: student.roll_number as string,
      email: (profile?.email as string | undefined) ?? "",
      full_name: (profile?.full_name as string | null | undefined) ?? null,
      cgpa: (student.cgpa as number | null) ?? null,
      branch: student.branch as string,
      branch_specialisation: (student.branch_specialisation as string | null) ?? null,
      profile_completed_at: (student.profile_completed_at as string | null) ?? null,
      is_active: Boolean(profile?.is_active),
      must_change_password: Boolean(profile?.must_change_password),
      resume_count: resumeCounts.get(student.id as string) ?? 0,
      application_count: applicationCounts.get(student.id as string) ?? 0
    };
  });
}

export async function getPendingResumesForOrganizer(): Promise<OrganizerResume[]> {
  const supabase = await createClient();
  const activeStudentIds = await getActiveStudentIds(supabase);

  if (activeStudentIds.length === 0) return [];

  const { data } = await supabase
    .from("resumes")
    .select("id,student_id,file_name,storage_path,file_size_bytes,status,verification_note,uploaded_at,students(roll_number,profiles(email,full_name,is_active))")
    .in("student_id", activeStudentIds)
    .eq("status", "pending")
    .is("removed_at", null)
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
    .select("id,company_id,title,duration,stipend,location,jd_file_name,jd_storage_path,deadline,gd_applicable,status,companies(name)")
    .order("created_at", { ascending: false });

  return Promise.all(
    (data ?? []).map(async (role) => {
      const company = one(role.companies) as Record<string, unknown> | null;
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
        stipend: (role.stipend as string | null) ?? null,
        location: (role.location as string | null) ?? null,
        jd_file_name: (role.jd_file_name as string | null) ?? null,
        jd_signed_url: signed.data?.signedUrl ?? null,
        deadline: (role.deadline as string | null) ?? null,
        gd_applicable: Boolean(role.gd_applicable),
        status: role.status as OrganizerRole["status"]
      };
    })
  );
}

export async function getAllApplicationsForOrganizer(options: { includeShareLinks?: boolean } = {}): Promise<OrganizerApplication[]> {
  const supabase = await createClient();
  const includeShareLinks = options.includeShareLinks === true;
  const activeStudentIds = await getActiveStudentIds(supabase);

  if (activeStudentIds.length === 0) return [];

  const { data } = await supabase
    .from("applications")
    .select("id,resume_id,role_id,applied_at,resume_shortlist_status,test_attended,test_status,gd_status,offer_status,students(roll_number,cgpa,alternate_email,branch_specialisation,profiles(email,full_name,is_active)),internship_roles(title,gd_applicable,companies(name)),resumes(id,file_name,storage_path)")
    .in("student_id", activeStudentIds)
    .order("applied_at", { ascending: false });

  return Promise.all(
    (data ?? []).map(async (application) => {
      const student = one(application.students) as Record<string, unknown> | null;
      const profile = one(student?.profiles as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
      const role = one(application.internship_roles) as Record<string, unknown> | null;
      const company = one(role?.companies as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
      const resume = one(application.resumes) as Record<string, unknown> | null;
      const resumeId = (application.resume_id as string | null | undefined) ?? (resume?.id as string | null | undefined) ?? null;
      const resumeStoragePath = resume?.storage_path as string | null | undefined;
      const [signed, sharePath] = await Promise.all([
        resumeStoragePath
          ? supabase.storage.from("resumes").createSignedUrl(resumeStoragePath, 60 * 10)
          : Promise.resolve({ data: null }),
        includeShareLinks ? getOrCreateResumeSharePath(supabase, application.id as string, resumeId) : Promise.resolve(null)
      ]);

      return {
        id: application.id as string,
        student_roll_number: (student?.roll_number as string | undefined) ?? "",
        student_email: (profile?.email as string | undefined) ?? "",
        student_personal_email: (student?.alternate_email as string | null | undefined) ?? null,
        student_name: (profile?.full_name as string | null | undefined) ?? null,
        student_cgpa: (student?.cgpa as number | null | undefined) ?? null,
        student_branch_specialisation: (student?.branch_specialisation as string | null | undefined) ?? null,
        role_id: application.role_id as string,
        company_name: (company?.name as string | undefined) ?? "Company",
        role_title: (role?.title as string | undefined) ?? "Role",
        resume_file_name: (resume?.file_name as string | undefined) ?? "Resume",
        resume_signed_url: signed.data?.signedUrl ?? null,
        resume_share_path: sharePath,
        applied_at: application.applied_at as string,
        gd_applicable: Boolean(role?.gd_applicable),
        resume_shortlist_status: application.resume_shortlist_status as OrganizerApplication["resume_shortlist_status"],
        test_attended: (application.test_attended as boolean | null) ?? null,
        test_status: application.test_status as OrganizerApplication["test_status"],
        gd_status: application.gd_status as OrganizerApplication["gd_status"],
        offer_status: application.offer_status as OrganizerApplication["offer_status"]
      };
    })
  );
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
export async function getVerifiersForOrganizer(): Promise<OrganizerVerifier[]> {
  const supabase = await createClient();
  const activeStudentIds = await getActiveStudentIds(supabase);
  const [{ data: profiles }, { data: assignments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,email,full_name")
      .eq("role", "verifier")
      .eq("is_active", true)
      .order("email", { ascending: true }),
    activeStudentIds.length > 0
      ? supabase.from("student_verifier_assignments").select("verifier_profile_id").in("student_id", activeStudentIds)
      : Promise.resolve({ data: [] })
  ]);

  const counts = new Map<string, number>();
  (assignments ?? []).forEach((assignment) => increment(counts, assignment.verifier_profile_id as string));

  return (profiles ?? []).map((profile) => ({
    profile_id: profile.id as string,
    email: profile.email as string,
    full_name: (profile.full_name as string | null) ?? null,
    assigned_student_count: counts.get(profile.id as string) ?? 0
  }));
}

export async function getVerifierAssignmentsForOrganizer(): Promise<OrganizerVerifierAssignment[]> {
  const supabase = await createClient();
  const activeStudentIds = await getActiveStudentIds(supabase);

  if (activeStudentIds.length === 0) return [];

  const { data } = await supabase
    .from("student_verifier_assignments")
    .select("id,student_id,verifier_profile_id,assigned_at,students(roll_number,profiles(email,full_name,is_active))")
    .in("student_id", activeStudentIds)
    .order("assigned_at", { ascending: false });

  const verifierIds = Array.from(new Set((data ?? []).map((assignment) => assignment.verifier_profile_id as string)));
  const { data: verifierProfiles } = verifierIds.length > 0
    ? await supabase.from("profiles").select("id,email,full_name").in("id", verifierIds)
    : { data: [] };
  const verifierById = new Map((verifierProfiles ?? []).map((profile) => [profile.id as string, profile]));

  return (data ?? []).map((assignment) => {
    const student = one(assignment.students) as Record<string, unknown> | null;
    const studentProfile = one(student?.profiles as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
    const verifierProfile = verifierById.get(assignment.verifier_profile_id as string) as Record<string, unknown> | undefined;

    return {
      id: assignment.id as string,
      student_id: assignment.student_id as string,
      student_roll_number: (student?.roll_number as string | undefined) ?? "",
      student_email: (studentProfile?.email as string | undefined) ?? "",
      student_name: (studentProfile?.full_name as string | null | undefined) ?? null,
      verifier_profile_id: assignment.verifier_profile_id as string,
      verifier_email: (verifierProfile?.email as string | undefined) ?? "",
      verifier_name: (verifierProfile?.full_name as string | null | undefined) ?? null,
      assigned_at: assignment.assigned_at as string
    };
  });
}

export async function getPendingMasterResumeEntriesForOrganizer(): Promise<OrganizerMasterResumeEntry[]> {
  const supabase = await createClient();
  const activeStudentIds = await getActiveStudentIds(supabase);

  if (activeStudentIds.length === 0) return [];

  const { data } = await supabase
    .from("master_resume_entries")
    .select("id,student_id,title,description,link,status,verification_note,created_at,students(roll_number,profiles(email,full_name,is_active))")
    .in("student_id", activeStudentIds)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  return (data ?? []).map((entry) => {
    const student = one(entry.students) as Record<string, unknown> | null;
    const profile = one(student?.profiles as Record<string, unknown> | Record<string, unknown>[] | null | undefined);

    return {
      id: entry.id as string,
      student_id: entry.student_id as string,
      title: entry.title as string,
      description: entry.description as string,
      link: (entry.link as string | null) ?? null,
      status: entry.status as OrganizerMasterResumeEntry["status"],
      verification_note: (entry.verification_note as string | null) ?? null,
      created_at: entry.created_at as string,
      student_roll_number: (student?.roll_number as string | undefined) ?? "",
      student_email: (profile?.email as string | undefined) ?? "",
      student_name: (profile?.full_name as string | null | undefined) ?? null
    };
  });
}
export async function getVerificationItemsForOrganizer(): Promise<OrganizerVerificationItem[]> {
  const supabase = await createClient();
  const activeStudentIds = await getActiveStudentIds(supabase);

  if (activeStudentIds.length === 0) return [];

  const [{ data: resumes }, { data: masterEntries }, { data: assignments }, { data: verifierProfiles }] = await Promise.all([
    supabase
      .from("resumes")
      .select("id,student_id,file_name,status,verification_note,uploaded_at,students(roll_number,profiles(email,full_name,is_active))")
      .in("student_id", activeStudentIds)
      .is("removed_at", null),
    supabase
      .from("master_resume_entries")
      .select("id,student_id,title,status,verification_note,created_at,students(roll_number,profiles(email,full_name,is_active))")
      .in("student_id", activeStudentIds),
    supabase.from("student_verifier_assignments").select("student_id,verifier_profile_id").in("student_id", activeStudentIds),
    supabase.from("profiles").select("id,email,full_name").eq("role", "verifier")
  ]);

  const assignmentByStudent = new Map((assignments ?? []).map((assignment) => [assignment.student_id as string, assignment.verifier_profile_id as string]));
  const verifierById = new Map((verifierProfiles ?? []).map((profile) => [profile.id as string, profile]));

  const fromStudent = (studentValue: unknown) => {
    const student = one(studentValue as Record<string, unknown> | Record<string, unknown>[] | null | undefined) as Record<string, unknown> | null;
    const profile = one(student?.profiles as Record<string, unknown> | Record<string, unknown>[] | null | undefined);

    return {
      rollNumber: (student?.roll_number as string | undefined) ?? "",
      email: (profile?.email as string | undefined) ?? "",
      name: (profile?.full_name as string | null | undefined) ?? null
    };
  };

  const attachAssignment = (studentId: string) => {
    const verifierId = assignmentByStudent.get(studentId) ?? null;
    const verifier = verifierId ? verifierById.get(verifierId) as Record<string, unknown> | undefined : undefined;

    return {
      assigned_verifier_profile_id: verifierId,
      assigned_verifier_email: (verifier?.email as string | null | undefined) ?? null,
      assigned_verifier_name: (verifier?.full_name as string | null | undefined) ?? null
    };
  };

  const resumeItems: OrganizerVerificationItem[] = (resumes ?? []).filter((resume) => embeddedStudentIsActive(resume.students)).map((resume) => {
    const studentId = resume.student_id as string;
    const student = fromStudent(resume.students);

    return {
      id: resume.id as string,
      kind: "resume",
      student_id: studentId,
      student_roll_number: student.rollNumber,
      student_email: student.email,
      student_name: student.name,
      title: resume.file_name as string,
      status: resume.status as OrganizerVerificationItem["status"],
      verification_note: (resume.verification_note as string | null) ?? null,
      submitted_at: resume.uploaded_at as string,
      ...attachAssignment(studentId)
    };
  });

  const masterItems: OrganizerVerificationItem[] = (masterEntries ?? []).filter((entry) => embeddedStudentIsActive(entry.students)).map((entry) => {
    const studentId = entry.student_id as string;
    const student = fromStudent(entry.students);

    return {
      id: entry.id as string,
      kind: "master",
      student_id: studentId,
      student_roll_number: student.rollNumber,
      student_email: student.email,
      student_name: student.name,
      title: entry.title as string,
      status: entry.status as OrganizerVerificationItem["status"],
      verification_note: (entry.verification_note as string | null) ?? null,
      submitted_at: entry.created_at as string,
      ...attachAssignment(studentId)
    };
  });

  const statusOrder = { pending: 0, verified: 1, rejected: 2 } as const;

  return [...resumeItems, ...masterItems].sort((a, b) => {
    const byStatus = statusOrder[a.status] - statusOrder[b.status];
    if (byStatus !== 0) return byStatus;
    return new Date(b.submitted_at).getTime() - new Date(a.submitted_at).getTime();
  });
}
