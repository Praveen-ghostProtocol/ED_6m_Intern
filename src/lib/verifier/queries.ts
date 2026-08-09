import { createClient } from "@/lib/supabase/server";
import type {
  VerifierDashboardStats,
  VerifierMasterResumeEntry,
  VerifierResume,
  VerifierStudent,
  VerifierStudentDetail
} from "@/types/verifier";

function one<T>(value: T | T[] | null | undefined): T | null {
  return Array.isArray(value) ? value[0] ?? null : value ?? null;
}

function increment(map: Map<string, number>, key: string) {
  map.set(key, (map.get(key) ?? 0) + 1);
}

export async function getVerifierDashboardStats(profileId: string): Promise<VerifierDashboardStats> {
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("student_verifier_assignments")
    .select("student_id")
    .eq("verifier_profile_id", profileId);
  const studentIds = (assignments ?? []).map((assignment) => assignment.student_id as string);

  if (studentIds.length === 0) {
    return { assignedStudents: 0, pendingMasterEntries: 0, pendingResumes: 0, rejectedMasterEntries: 0 };
  }

  const [pendingMasterEntries, pendingResumes, rejectedMasterEntries] = await Promise.all([
    supabase.from("master_resume_entries").select("id", { count: "exact", head: true }).in("student_id", studentIds).eq("status", "pending"),
    supabase.from("resumes").select("id", { count: "exact", head: true }).in("student_id", studentIds).eq("status", "pending").is("removed_at", null),
    supabase.from("master_resume_entries").select("id", { count: "exact", head: true }).in("student_id", studentIds).eq("status", "rejected")
  ]);

  return {
    assignedStudents: studentIds.length,
    pendingMasterEntries: pendingMasterEntries.count ?? 0,
    pendingResumes: pendingResumes.count ?? 0,
    rejectedMasterEntries: rejectedMasterEntries.count ?? 0
  };
}

export async function getAssignedStudentsForVerifier(profileId: string): Promise<VerifierStudent[]> {
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("student_verifier_assignments")
    .select("student_id,students(id,roll_number,cgpa,branch_specialisation,profiles(email,full_name))")
    .eq("verifier_profile_id", profileId)
    .order("assigned_at", { ascending: false });

  const studentIds = (assignments ?? []).map((assignment) => assignment.student_id as string);
  const [{ data: masterEntries }, { data: resumes }] = await Promise.all([
    studentIds.length > 0 ? supabase.from("master_resume_entries").select("student_id").in("student_id", studentIds) : Promise.resolve({ data: [] }),
    studentIds.length > 0 ? supabase.from("resumes").select("student_id").in("student_id", studentIds).is("removed_at", null) : Promise.resolve({ data: [] })
  ]);

  const masterCounts = new Map<string, number>();
  const resumeCounts = new Map<string, number>();
  (masterEntries ?? []).forEach((entry) => increment(masterCounts, entry.student_id as string));
  (resumes ?? []).forEach((resume) => increment(resumeCounts, resume.student_id as string));

  return (assignments ?? []).map((assignment) => {
    const student = one(assignment.students) as Record<string, unknown> | null;
    const profile = one(student?.profiles as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
    const studentId = assignment.student_id as string;

    return {
      id: studentId,
      roll_number: (student?.roll_number as string | undefined) ?? "",
      email: (profile?.email as string | undefined) ?? "",
      full_name: (profile?.full_name as string | null | undefined) ?? null,
      cgpa: (student?.cgpa as number | null | undefined) ?? null,
      branch_specialisation: (student?.branch_specialisation as string | null | undefined) ?? null,
      master_entry_count: masterCounts.get(studentId) ?? 0,
      resume_count: resumeCounts.get(studentId) ?? 0
    };
  });
}

export async function getMasterResumeEntriesForVerifier(profileId: string): Promise<VerifierMasterResumeEntry[]> {
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("student_verifier_assignments")
    .select("student_id")
    .eq("verifier_profile_id", profileId);
  const studentIds = (assignments ?? []).map((assignment) => assignment.student_id as string);

  if (studentIds.length === 0) return [];

  const { data } = await supabase
    .from("master_resume_entries")
    .select("id,student_id,title,description,link,status,verification_note,created_at,students(roll_number,profiles(email,full_name))")
    .in("student_id", studentIds)
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
      status: entry.status as VerifierMasterResumeEntry["status"],
      verification_note: (entry.verification_note as string | null) ?? null,
      created_at: entry.created_at as string,
      student_roll_number: (student?.roll_number as string | undefined) ?? "",
      student_email: (profile?.email as string | undefined) ?? "",
      student_name: (profile?.full_name as string | null | undefined) ?? null
    };
  });
}

export async function getResumesForVerifier(profileId: string): Promise<VerifierResume[]> {
  const supabase = await createClient();
  const { data: assignments } = await supabase
    .from("student_verifier_assignments")
    .select("student_id")
    .eq("verifier_profile_id", profileId);
  const studentIds = (assignments ?? []).map((assignment) => assignment.student_id as string);

  if (studentIds.length === 0) return [];

  const { data } = await supabase
    .from("resumes")
    .select("id,student_id,file_name,storage_path,file_size_bytes,status,verification_note,uploaded_at,students(roll_number,profiles(email,full_name))")
    .in("student_id", studentIds)
    .is("removed_at", null)
    .order("uploaded_at", { ascending: true });

  return Promise.all(
    (data ?? []).map(async (resume) => {
      const student = one(resume.students) as Record<string, unknown> | null;
      const profile = one(student?.profiles as Record<string, unknown> | Record<string, unknown>[] | null | undefined);
      const { data: signed } = await supabase.storage.from("resumes").createSignedUrl(resume.storage_path as string, 60 * 10);

      return {
        id: resume.id as string,
        student_id: resume.student_id as string,
        file_name: resume.file_name as string,
        file_size_bytes: resume.file_size_bytes as number,
        status: resume.status as VerifierResume["status"],
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
export async function getAssignedStudentDetailForVerifier(profileId: string, studentId: string): Promise<VerifierStudentDetail | null> {
  const students = await getAssignedStudentsForVerifier(profileId);
  const student = students.find((candidate) => candidate.id === studentId) ?? null;

  if (!student) return null;

  const [masterEntries, resumes] = await Promise.all([
    getMasterResumeEntriesForVerifier(profileId),
    getResumesForVerifier(profileId)
  ]);

  return {
    ...student,
    master_entries: masterEntries.filter((entry) => entry.student_id === studentId),
    resumes: resumes.filter((resume) => resume.student_id === studentId)
  };
}