"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";

const uuidSchema = z.string().uuid();

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, name: string) {
  const value = textValue(formData, name);
  return value.length > 0 ? value : null;
}

function optionalUuid(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" && uuidSchema.safeParse(value).success ? value : null;
}

function revalidateVerifierReviewPaths(studentId?: string | null) {
  revalidatePath("/verifier");
  revalidatePath("/verifier/students");
  revalidatePath("/verifier/master-resume");
  revalidatePath("/verifier/resumes");
  revalidatePath("/student/master-resume");
  revalidatePath("/student/resumes");
  revalidatePath("/organizer/resumes");
  revalidatePath("/organizer/verifiers");
  if (studentId) revalidatePath(`/verifier/students/${studentId}`);
}

export async function verifyMasterResumeEntry(formData: FormData) {
  const profile = await requireRole("verifier");
  const entryId = uuidSchema.parse(formData.get("entryId"));
  const studentId = optionalUuid(formData, "studentId");
  const supabase = await createClient();

  await supabase
    .from("master_resume_entries")
    .update({
      status: "verified",
      verification_note: nullableText(formData, "verificationNote"),
      verified_by: profile.id,
      verified_at: new Date().toISOString()
    })
    .eq("id", entryId)
    .eq("status", "pending");

  revalidateVerifierReviewPaths(studentId);
}

export async function rejectMasterResumeEntry(formData: FormData) {
  const profile = await requireRole("verifier");
  const entryId = uuidSchema.parse(formData.get("entryId"));
  const studentId = optionalUuid(formData, "studentId");
  const note = nullableText(formData, "verificationNote");
  const supabase = await createClient();

  await supabase
    .from("master_resume_entries")
    .update({
      status: "rejected",
      verification_note: note,
      verified_by: profile.id,
      verified_at: new Date().toISOString()
    })
    .eq("id", entryId)
    .eq("status", "pending");

  revalidateVerifierReviewPaths(studentId);
}

export async function verifyAssignedResume(formData: FormData) {
  const profile = await requireRole("verifier");
  const resumeId = uuidSchema.parse(formData.get("resumeId"));
  const studentId = optionalUuid(formData, "studentId");
  const supabase = await createClient();

  await supabase
    .from("resumes")
    .update({
      status: "verified",
      verification_note: nullableText(formData, "verificationNote"),
      verified_by: profile.id,
      verified_at: new Date().toISOString()
    })
    .eq("id", resumeId)
    .eq("status", "pending");

  revalidateVerifierReviewPaths(studentId);
}

export async function rejectAssignedResume(formData: FormData) {
  const profile = await requireRole("verifier");
  const resumeId = uuidSchema.parse(formData.get("resumeId"));
  const studentId = optionalUuid(formData, "studentId");
  const note = nullableText(formData, "verificationNote");
  const supabase = await createClient();

  await supabase
    .from("resumes")
    .update({
      status: "rejected",
      verification_note: note,
      verified_by: profile.id,
      verified_at: new Date().toISOString()
    })
    .eq("id", resumeId)
    .eq("status", "pending");

  revalidateVerifierReviewPaths(studentId);
}