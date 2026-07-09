import { randomUUID } from "crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

export const maxJobDescriptionPdfSizeBytes = 10 * 1024 * 1024;

export type UploadedJobDescription = {
  fileName: string;
  storagePath: string;
  fileSizeBytes: number;
};

export function sanitizeUploadFileName(fileName: string) {
  const cleaned = fileName.replace(/[^a-zA-Z0-9._-]/g, "-").replace(/-+/g, "-");
  return cleaned || "document.pdf";
}

export function getOptionalPdfFile(formData: FormData, fieldName: string) {
  const file = formData.get(fieldName);

  if (!(file instanceof File) || file.size === 0) {
    return null;
  }

  return file;
}

export function validateJobDescriptionPdf(file: File) {
  if (file.type !== "application/pdf") {
    return "Only PDF job descriptions are allowed.";
  }

  if (file.size > maxJobDescriptionPdfSizeBytes) {
    return "JD PDF size must be 10 MB or less.";
  }

  return null;
}

export async function uploadJobDescriptionPdf(
  supabase: SupabaseClient,
  file: File,
  companyId: string
): Promise<{ data: UploadedJobDescription | null; error: string | null }> {
  const validationError = validateJobDescriptionPdf(file);

  if (validationError) {
    return { data: null, error: validationError };
  }

  const fileName = sanitizeUploadFileName(file.name);
  const storagePath = `${companyId}/${randomUUID()}-${fileName}`;
  const { error } = await supabase.storage
    .from("job-descriptions")
    .upload(storagePath, file, {
      contentType: "application/pdf",
      upsert: false
    });

  if (error) {
    return { data: null, error: "Could not upload the JD PDF. Please try again." };
  }

  return {
    data: {
      fileName,
      storagePath,
      fileSizeBytes: file.size
    },
    error: null
  };
}