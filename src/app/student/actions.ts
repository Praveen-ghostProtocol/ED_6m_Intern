"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireStudent } from "@/lib/student/guards";
import {
  branchSpecialisations,
  genderOptions
} from "@/types/student";

export type StudentActionState = {
  error?: string;
  success?: string;
};

const uuidSchema = z.string().uuid();
const maxResumeSizeBytes = 5 * 1024 * 1024;
const optionalTextSchema = z.string().trim().transform((value) => (value.length > 0 ? value : null));
const requiredTextSchema = z.string().trim().min(1, "Fill all required fields.");
const pincodeSchema = z.string().trim().regex(/^\d{4,10}$/, "Use a valid pincode.");
const cgpaSchema = z.coerce.number().min(0, "CGPA must be at least 0.").max(10, "CGPA cannot exceed 10.");
const idddPrefix = "IDDD - ";
const profileSchema = z.object({
  fullName: requiredTextSchema.max(120),
  phone: requiredTextSchema.max(24),
  alternatePhone: optionalTextSchema,
  alternateEmail: z.string().trim().email("Use a valid alternate email.").optional().or(z.literal("")).transform((value) => value || null),
  dateOfBirth: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a valid date of birth."),
  gender: z.enum(genderOptions),
  currentAddressPincode: pincodeSchema,
  currentAddress: requiredTextSchema.max(800),
  permanentAddressPincode: pincodeSchema,
  permanentAddress: requiredTextSchema.max(800),
  branchSpecialisation: z.enum(branchSpecialisations),
  idddSpecialisation: optionalTextSchema,
  cgpa: cgpaSchema
});

function sanitizeFileName(fileName: string) {
  const cleaned = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned || "resume.pdf";
}

function formText(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function isDeadlinePassed(deadline: string | null | undefined) {
  return Boolean(deadline && new Date(deadline) < new Date());
}

async function requireStudentContext() {
  return requireStudent();
}

async function validateVerifiedResume(studentId: string, resumeId: string) {
  const supabase = await createClient();
  const { data: resume } = await supabase
    .from("resumes")
    .select("id,status,student_id")
    .eq("id", resumeId)
    .eq("student_id", studentId)
    .single();

  return Boolean(resume && resume.status === "verified");
}

async function getOpenRole(roleId: string) {
  const supabase = await createClient();
  const { data: role } = await supabase
    .from("internship_roles")
    .select("id,status,deadline,gd_applicable")
    .eq("id", roleId)
    .single();

  return role;
}

function revalidateStudentApplicationPaths() {
  revalidatePath("/student");
  revalidatePath("/student/companies");
  revalidatePath("/student/applications");
  revalidatePath("/recruiter");
  revalidatePath("/recruiter/applications");
  revalidatePath("/organizer/applications");
  revalidatePath("/organizer/reports");
}

export async function updateStudentProfile(
  _previousState: StudentActionState,
  formData: FormData
): Promise<StudentActionState> {
  const { profile, student } = await requireStudent({ allowIncomplete: true });
  const parsed = profileSchema.safeParse({
    fullName: formText(formData, "fullName"),
    phone: formText(formData, "phone"),
    alternatePhone: formText(formData, "alternatePhone"),
    alternateEmail: formText(formData, "alternateEmail"),
    dateOfBirth: formText(formData, "dateOfBirth"),
    gender: formText(formData, "gender"),
    currentAddressPincode: formText(formData, "currentAddressPincode"),
    currentAddress: formText(formData, "currentAddress"),
    permanentAddressPincode: formText(formData, "permanentAddressPincode"),
    permanentAddress: formText(formData, "permanentAddress"),
    branchSpecialisation: formText(formData, "branchSpecialisation"),
    idddSpecialisation: formText(formData, "idddSpecialisation"),
    cgpa: formText(formData, "cgpa")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the profile details and try again." };
  }

  if (parsed.data.branchSpecialisation === "IDDD" && !parsed.data.idddSpecialisation) {
    return { error: "Enter the IDDD specialisation." };
  }

  const branchSpecialisationValue =
    parsed.data.branchSpecialisation === "IDDD"
      ? `${idddPrefix}${parsed.data.idddSpecialisation ?? ""}`
      : parsed.data.branchSpecialisation;

  const supabase = await createClient();
  const { error: profileError } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.fullName })
    .eq("id", profile.id);

  if (profileError) {
    return { error: profileError.message };
  }

  const { error: studentError } = await supabase
    .from("students")
    .update({
      phone: parsed.data.phone,
      alternate_phone: parsed.data.alternatePhone,
      alternate_email: parsed.data.alternateEmail,
      date_of_birth: parsed.data.dateOfBirth,
      gender: parsed.data.gender,
      current_address_pincode: parsed.data.currentAddressPincode,
      current_address: parsed.data.currentAddress,
      permanent_address_pincode: parsed.data.permanentAddressPincode,
      permanent_address: parsed.data.permanentAddress,
      branch_specialisation: branchSpecialisationValue,
      cgpa: parsed.data.cgpa,
      profile_completed_at: new Date().toISOString()
    })
    .eq("id", student.id);

  if (studentError) {
    return { error: studentError.message };
  }

  revalidatePath("/student");
  revalidatePath("/student/profile");
  redirect("/student");
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

  const [resumeIsVerified, role] = await Promise.all([
    validateVerifiedResume(studentId, resumeResult.data),
    getOpenRole(roleResult.data)
  ]);

  if (!resumeIsVerified) {
    return { error: "Only verified resumes can be used for applications." };
  }

  if (!role || role.status !== "open") {
    return { error: "This role is not open for applications." };
  }

  if (isDeadlinePassed(role.deadline as string | null)) {
    return { error: "The application deadline has passed." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("applications").insert({
    student_id: studentId,
    role_id: roleResult.data,
    resume_id: resumeResult.data,
    gd_status: role.gd_applicable ? "pending" : "not_applicable"
  });

  if (error) {
    if (error.code === "23505") {
      return { error: "You have already registered for this role." };
    }

    return { error: error.message };
  }

  revalidateStudentApplicationPaths();
  return { success: "Registration submitted successfully." };
}

export async function updateApplicationResume(
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

  const applicationResult = uuidSchema.safeParse(formData.get("applicationId"));
  const resumeResult = uuidSchema.safeParse(formData.get("resumeId"));

  if (!applicationResult.success || !resumeResult.success) {
    return { error: "Choose a valid application and verified resume." };
  }

  const supabase = await createClient();
  const { data: application } = await supabase
    .from("applications")
    .select("id,student_id,role_id,internship_roles(status,deadline)")
    .eq("id", applicationResult.data)
    .eq("student_id", studentId)
    .single();

  if (!application) {
    return { error: "Application not found." };
  }

  const role = Array.isArray(application.internship_roles)
    ? application.internship_roles[0]
    : application.internship_roles;

  if (!role || role.status !== "open") {
    return { error: "This role is not open for resume changes." };
  }

  if (isDeadlinePassed(role.deadline as string | null)) {
    return { error: "The application deadline has passed." };
  }

  const resumeIsVerified = await validateVerifiedResume(studentId, resumeResult.data);

  if (!resumeIsVerified) {
    return { error: "Only verified resumes can be used for applications." };
  }

  const { error } = await supabase
    .from("applications")
    .update({ resume_id: resumeResult.data })
    .eq("id", applicationResult.data)
    .eq("student_id", studentId);

  if (error) {
    return { error: error.message };
  }

  revalidateStudentApplicationPaths();
  return { success: "Registered resume updated." };
}

export async function removeApplication(
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

  const applicationResult = uuidSchema.safeParse(formData.get("applicationId"));

  if (!applicationResult.success) {
    return { error: "Choose a valid application." };
  }

  const supabase = await createClient();
  const { data: application } = await supabase
    .from("applications")
    .select("id,student_id,internship_roles(status,deadline)")
    .eq("id", applicationResult.data)
    .eq("student_id", studentId)
    .single();

  if (!application) {
    return { error: "Application not found." };
  }

  const role = Array.isArray(application.internship_roles)
    ? application.internship_roles[0]
    : application.internship_roles;

  if (!role || role.status !== "open") {
    return { error: "This role is not open for removal." };
  }

  if (isDeadlinePassed(role.deadline as string | null)) {
    return { error: "The application deadline has passed." };
  }

  const { error } = await supabase
    .from("applications")
    .delete()
    .eq("id", applicationResult.data)
    .eq("student_id", studentId);

  if (error) {
    return { error: error.message };
  }

  revalidateStudentApplicationPaths();
  return { success: "Registration removed. You can register again before the deadline." };
}
const masterResumeSchema = z.object({
  title: requiredTextSchema.max(160, "Title is too long."),
  description: requiredTextSchema.max(2000, "Description is too long."),
  link: z.string().trim().optional().or(z.literal("")).transform((value) => value || null)
});

function validateMasterResumeLink(link: string | null) {
  if (!link) return true;

  try {
    const url = new URL(link);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export async function createMasterResumeEntry(
  _previousState: StudentActionState,
  formData: FormData
): Promise<StudentActionState> {
  const { student } = await requireStudentContext();
  const parsed = masterResumeSchema.safeParse({
    title: formText(formData, "title"),
    description: formText(formData, "description"),
    link: formText(formData, "link")
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the entry and try again." };
  }

  if (!validateMasterResumeLink(parsed.data.link)) {
    return { error: "Use a valid http or https link." };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("master_resume_entries").insert({
    student_id: student.id,
    title: parsed.data.title,
    description: parsed.data.description,
    link: parsed.data.link,
    status: "pending"
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/student");
  revalidatePath("/student/master-resume");
  revalidatePath("/verifier");
  revalidatePath("/verifier/master-resume");
  revalidatePath("/organizer/resumes");
  return { success: "Master resume entry submitted for verification." };
}

export async function updateMasterResumeEntry(
  _previousState: StudentActionState,
  formData: FormData
): Promise<StudentActionState> {
  const { student } = await requireStudentContext();
  const entryId = uuidSchema.safeParse(formData.get("entryId"));
  const parsed = masterResumeSchema.safeParse({
    title: formText(formData, "title"),
    description: formText(formData, "description"),
    link: formText(formData, "link")
  });

  if (!entryId.success) {
    return { error: "Choose a valid master resume entry." };
  }

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the entry and try again." };
  }

  if (!validateMasterResumeLink(parsed.data.link)) {
    return { error: "Use a valid http or https link." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("master_resume_entries")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      link: parsed.data.link,
      status: "pending",
      verification_note: null,
      verified_by: null,
      verified_at: null
    })
    .eq("id", entryId.data)
    .eq("student_id", student.id)
    .in("status", ["pending", "rejected"])
    .select("id")
    .maybeSingle();

  if (error) {
    return { error: error.message };
  }

  if (!data) {
    return { error: "Approved master resume entries cannot be edited." };
  }

  revalidatePath("/student");
  revalidatePath("/student/master-resume");
  revalidatePath("/verifier");
  revalidatePath("/verifier/master-resume");
  revalidatePath("/organizer/resumes");
  return { success: "Entry saved and sent for verification." };
}
