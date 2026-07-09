"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { getOptionalPdfFile, uploadJobDescriptionPdf } from "@/lib/job-description-files";
import { getRecruiterByProfileId } from "@/lib/recruiter/queries";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/student";

export type RecruiterActionState = {
  error?: string;
  success?: string;
};

const uuidSchema = z.string().uuid();
const applicationStatusSchema = z.enum([
  "pending",
  "shortlisted",
  "rejected",
  "not_applicable",
  "selected",
  "offer_given"
]);
const roleStatusSchema = z.enum(["draft", "open", "closed"]);
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

async function requireRecruiterContext() {
  const profile = await requireRole("recruiter");
  const recruiter = await getRecruiterByProfileId(profile.id);

  return { profile, recruiter };
}

export async function createCompanyRole(
  _previousState: RecruiterActionState,
  formData: FormData
): Promise<RecruiterActionState> {
  const { profile, recruiter } = await requireRecruiterContext();

  if (!recruiter) {
    return { error: "Ask the internship organizer to link this login to a company first." };
  }

  const status = roleStatusSchema.safeParse(formData.get("status"));
  const title = textValue(formData, "title");
  const jobDescription = textValue(formData, "jobDescription");
  const jdPdf = getOptionalPdfFile(formData, "jdPdf");

  if (!status.success) return { error: "Choose a valid role status." };
  if (title.length < 2) return { error: "Role title is required." };
  if (jobDescription.length < 10 && !jdPdf) return { error: "Add a JD PDF or enter a job description." };

  const supabase = await createClient();
  const uploadedJd = jdPdf ? await uploadJobDescriptionPdf(supabase, jdPdf, recruiter.company_id) : { data: null, error: null };

  if (uploadedJd.error) return { error: uploadedJd.error };

  const { data: role, error } = await supabase
    .from("internship_roles")
    .insert({
      company_id: recruiter.company_id,
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
    })
    .select("id")
    .single();

  if (error || !role) {
    if (uploadedJd.data?.storagePath) {
      await supabase.storage.from("job-descriptions").remove([uploadedJd.data.storagePath]);
    }

    return { error: error?.message ?? "Could not create the role." };
  }

  const { error: assignmentError } = await supabase
    .from("recruiter_role_assignments")
    .upsert({ recruiter_id: recruiter.id, role_id: role.id as string }, { onConflict: "recruiter_id,role_id" });

  if (assignmentError) {
    return { error: assignmentError.message };
  }

  revalidatePath("/recruiter");
  revalidatePath("/recruiter/roles");
  revalidatePath("/recruiter/applications");
  revalidatePath("/student/companies");
  revalidatePath("/organizer/roles");
  revalidatePath("/organizer/recruiters");

  return { success: "Role created." };
}
export async function updateRecruiterApplicationStage(formData: FormData) {
  const { profile, recruiter } = await requireRecruiterContext();

  if (!recruiter) {
    return;
  }

  const applicationId = uuidSchema.parse(formData.get("applicationId"));
  const fieldName = applicationStageSchema.parse(formData.get("fieldName"));
  const newStatus = applicationStatusSchema.parse(formData.get("status")) as ApplicationStatus;
  const supabase = await createClient();

  const { data: application } = await supabase
    .from("applications")
    .select("role_id,resume_shortlist_status,test_status,gd_status,offer_status,internship_roles(gd_applicable)")
    .eq("id", applicationId)
    .single();

  if (!application) {
    return;
  }

  const { data: assignment } = await supabase
    .from("recruiter_role_assignments")
    .select("role_id")
    .eq("recruiter_id", recruiter.id)
    .eq("role_id", application.role_id as string)
    .single();

  if (!assignment) {
    return;
  }

  const role = Array.isArray(application.internship_roles)
    ? application.internship_roles[0]
    : application.internship_roles;

  if (fieldName === "gd_status" && !role?.gd_applicable) {
    return;
  }

  const oldStatus = application[fieldName] as ApplicationStatus | undefined;

  await supabase.from("applications").update({ [fieldName]: newStatus }).eq("id", applicationId);

  await supabase.from("status_history").insert({
    application_id: applicationId,
    changed_by: profile.id,
    field_name: fieldName,
    old_status: oldStatus ?? null,
    new_status: newStatus
  });

  revalidatePath("/recruiter");
  revalidatePath("/recruiter/applications");
  revalidatePath("/student/applications");
  revalidatePath("/organizer/applications");
  revalidatePath("/organizer/reports");
}