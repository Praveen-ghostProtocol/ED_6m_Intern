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

async function requireStudentContext() {
  return requireStudent();
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