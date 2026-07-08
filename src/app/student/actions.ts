"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getStudentByProfileId } from "@/lib/student/queries";

export type StudentActionState = {
  error?: string;
  success?: string;
};

const uuidSchema = z.string().uuid();
const maxResumeSizeBytes = 5 * 1024 * 1024;

function sanitizeFileName(fileName: string) {
  const cleaned = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned || "resume.pdf";
}

async function requireStudentContext() {
  const profile = await requireRole("student");
  const student = await getStudentByProfileId(profile.id);

  if (!student) {
    throw new Error("Your student profile has not been imported yet.");
  }

  return { profile, student };
}

export async function uploadResume(
  _previousState: StudentActionState,
  formData: FormData
): Promise<StudentActionState> {
  let studentId: string;

  try {
    const context = await requireStudentContext();
    studentId = context.student.id;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not confirm student access." };
  }

  const file = formData.get("resume");

  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose a PDF resume to upload." };
  }

  if (file.type !== "application/pdf") {
    return { error: "Only PDF resumes are allowed." };
  }

  if (file.size > maxResumeSizeBytes) {
    return { error: "Resume size must be 5 MB or less." };
  }

  const supabase = await createClient();
  const { count } = await supabase
    .from("resumes")
    .select("id", { count: "exact", head: true })
    .eq("student_id", studentId);

  if ((count ?? 0) >= 3) {
    return { error: "You can upload a maximum of three resumes." };
  }

  const safeName = sanitizeFileName(file.name);
  const storagePath = `${studentId}/${Date.now()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from("resumes")
    .upload(storagePath, file, {
      contentType: "application/pdf",
      upsert: false
    });

  if (uploadError) {
    return { error: "Could not upload the resume. Please try again." };
  }

  const { error: insertError } = await supabase.from("resumes").insert({
    student_id: studentId,
    file_name: safeName,
    storage_path: storagePath,
    mime_type: "application/pdf",
    file_size_bytes: file.size,
    status: "pending"
  });

  if (insertError) {
    await supabase.storage.from("resumes").remove([storagePath]);
    return { error: insertError.message };
  }

  revalidatePath("/student");
  revalidatePath("/student/resumes");

  return { success: "Resume uploaded. Verification status is pending." };
}

export async function applyToRole(
  _previousState: StudentActionState,
  formData: FormData
): Promise<StudentActionState> {
  let studentId: string;

  try {
    const context = await requireStudentContext();
    studentId = context.student.id;
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not confirm student access." };
  }

  const roleResult = uuidSchema.safeParse(formData.get("roleId"));
  const resumeResult = uuidSchema.safeParse(formData.get("resumeId"));

  if (!roleResult.success || !resumeResult.success) {
    return { error: "Choose a valid role and verified resume." };
  }

  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("id,status,student_id")
    .eq("id", resumeResult.data)
    .eq("student_id", studentId)
    .single();

  if (!resume || resume.status !== "verified") {
    return { error: "Only verified resumes can be used for applications." };
  }

  const { data: role } = await supabase
    .from("internship_roles")
    .select("id,status,deadline,gd_applicable")
    .eq("id", roleResult.data)
    .single();

  if (!role || role.status !== "open") {
    return { error: "This role is not open for applications." };
  }

  if (role.deadline && new Date(role.deadline as string) < new Date()) {
    return { error: "The application deadline has passed." };
  }

  const { error } = await supabase.from("applications").insert({
    student_id: studentId,
    role_id: roleResult.data,
    resume_id: resumeResult.data,
    gd_status: role.gd_applicable ? "pending" : "not_applicable"
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You have already applied for this role." };
    }

    return { error: error.message };
  }

  revalidatePath("/student");
  revalidatePath("/student/companies");
  revalidatePath("/student/applications");

  return { success: "Application submitted successfully." };
}