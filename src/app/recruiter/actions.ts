"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireRole } from "@/lib/auth/guards";
import { getRecruiterByProfileId } from "@/lib/recruiter/queries";
import { createClient } from "@/lib/supabase/server";
import type { ApplicationStatus } from "@/types/student";

const uuidSchema = z.string().uuid();
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

export async function updateRecruiterApplicationStage(formData: FormData) {
  const profile = await requireRole("recruiter");
  const recruiter = await getRecruiterByProfileId(profile.id);

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