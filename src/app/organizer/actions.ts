"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { createClient } from "@/lib/supabase/server";
import { getOptionalPdfFile, uploadJobDescriptionPdf } from "@/lib/job-description-files";
import type { ApplicationStatus } from "@/types/student";
import type { RoleStatus } from "@/types/organizer";

export type OrganizerActionState = {
  error?: string;
  success?: string;
};

const uuidSchema = z.string().uuid();
const roleStatusSchema = z.enum(["draft", "open", "closed"]);
const applicationStatusSchema = z.enum([
  "pending",
  "shortlisted",
  "rejected",
  "not_applicable",
  "selected",
  "offer_given"
]);
const applicationStageSchema = z.enum([
  "resume_shortlist_status",
  "test_status",
  "gd_status",
  "offer_status"
]);

function textValue(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function nullableText(formData: FormData, name: string) {
  const value = textValue(formData, name);
  return value.length > 0 ? value : null;
}

function dateToDeadline(value: string) {
  return value ? new Date(`${value}T23:59:00+05:30`).toISOString() : null;
}

async function requireOrganizer() {
  return requireRole("organizer");
}

export async function verifyResume(formData: FormData) {
  const profile = await requireOrganizer();
  const resumeId = uuidSchema.parse(formData.get("resumeId"));
  const supabase = await createClient();

  await supabase
    .from("resumes")
    .update({
      status: "verified",
      verification_note: null,
      verified_by: profile.id,
      verified_at: new Date().toISOString()
    })
    .eq("id", resumeId)
    .eq("status", "pending");

  revalidatePath("/organizer");
  revalidatePath("/organizer/resumes");
  revalidatePath("/student/resumes");
}

export async function rejectResume(formData: FormData) {
  const profile = await requireOrganizer();
  const resumeId = uuidSchema.parse(formData.get("resumeId"));
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

  revalidatePath("/organizer");
  revalidatePath("/organizer/resumes");
  revalidatePath("/student/resumes");
}

export async function createCompany(
  _previousState: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  await requireOrganizer();
  const name = textValue(formData, "name");
  const description = nullableText(formData, "description");

  if (name.length < 2) {
    return { error: "Company name is required." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("companies").insert({ name, description });

  if (error) {
    return { error: error.code === "23505" ? "This company already exists." : error.message };
  }

  revalidatePath("/organizer");
  revalidatePath("/organizer/roles");
  return { success: "Company created." };
}

export async function createInternshipRole(
  _previousState: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  const profile = await requireOrganizer();
  const companyId = uuidSchema.safeParse(formData.get("companyId"));
  const status = roleStatusSchema.safeParse(formData.get("status"));
  const title = textValue(formData, "title");
  const jobDescription = textValue(formData, "jobDescription");
  const jdPdf = getOptionalPdfFile(formData, "jdPdf");

  if (!companyId.success) return { error: "Choose a valid company." };
  if (!status.success) return { error: "Choose a valid role status." };
  if (title.length < 2) return { error: "Role title is required." };
  if (jobDescription.length < 10 && !jdPdf) return { error: "Add a JD PDF or enter a job description." };

  const supabase = await createClient();
  const uploadedJd = jdPdf ? await uploadJobDescriptionPdf(supabase, jdPdf, companyId.data) : { data: null, error: null };

  if (uploadedJd.error) return { error: uploadedJd.error };

  const { error } = await supabase.from("internship_roles").insert({
    company_id: companyId.data,
    title,
    duration: nullableText(formData, "duration"),
    stipend: nullableText(formData, "stipend"),
    location: nullableText(formData, "location"),
    eligibility: nullableText(formData, "eligibility"),
    job_description: jobDescription || "JD uploaded as PDF.",
    jd_file_name: uploadedJd.data?.fileName ?? null,
    jd_storage_path: uploadedJd.data?.storagePath ?? null,
    jd_file_size_bytes: uploadedJd.data?.fileSizeBytes ?? null,
    selection_process: nullableText(formData, "selectionProcess"),
    gd_applicable: formData.get("gdApplicable") === "on",
    deadline: dateToDeadline(textValue(formData, "deadline")),
    status: status.data,
    created_by: profile.id
  });

  if (error) {
    if (uploadedJd.data?.storagePath) {
      await supabase.storage.from("job-descriptions").remove([uploadedJd.data.storagePath]);
    }

    return { error: error.message };
  }

  revalidatePath("/organizer");
  revalidatePath("/organizer/roles");
  revalidatePath("/student/companies");
  return { success: "Role created." };
}

export async function updateInternshipRole(formData: FormData) {
  await requireOrganizer();
  const roleId = uuidSchema.parse(formData.get("roleId"));
  const status = roleStatusSchema.parse(formData.get("status")) as RoleStatus;
  const supabase = await createClient();

  await supabase.from("internship_roles").update({ status }).eq("id", roleId);

  revalidatePath("/organizer");
  revalidatePath("/organizer/roles");
  revalidatePath("/student/companies");
}

export async function updateApplicationStage(formData: FormData) {
  const profile = await requireOrganizer();
  const applicationId = uuidSchema.parse(formData.get("applicationId"));
  const fieldName = applicationStageSchema.parse(formData.get("fieldName"));
  const newStatus = applicationStatusSchema.parse(formData.get("status")) as ApplicationStatus;
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("applications")
    .select("resume_shortlist_status,test_status,gd_status,offer_status")
    .eq("id", applicationId)
    .single();

  const oldStatus = existing?.[fieldName] as ApplicationStatus | undefined;

  await supabase.from("applications").update({ [fieldName]: newStatus }).eq("id", applicationId);

  await supabase.from("status_history").insert({
    application_id: applicationId,
    changed_by: profile.id,
    field_name: fieldName,
    old_status: oldStatus ?? null,
    new_status: newStatus
  });

  revalidatePath("/organizer");
  revalidatePath("/organizer/applications");
  revalidatePath("/organizer/reports");
  revalidatePath("/student/applications");
}

export async function assignRecruiterToRole(formData: FormData) {
  await requireOrganizer();
  const recruiterId = uuidSchema.parse(formData.get("recruiterId"));
  const roleId = uuidSchema.parse(formData.get("roleId"));
  const supabase = await createClient();

  await supabase
    .from("recruiter_role_assignments")
    .upsert({ recruiter_id: recruiterId, role_id: roleId }, { onConflict: "recruiter_id,role_id" });

  revalidatePath("/organizer/recruiters");
  revalidatePath("/recruiter");
}