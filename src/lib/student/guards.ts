import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/guards";
import { getStudentByProfileId } from "@/lib/student/queries";
import type { Profile } from "@/types/auth";
import type { StudentRecord } from "@/types/student";

type StudentContext = {
  profile: Profile;
  student: StudentRecord;
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function isStudentProfileComplete(student: StudentRecord, profile?: Profile | null) {
  return Boolean(
    hasText(profile?.full_name) &&
      hasText(student.phone) &&
      hasText(student.date_of_birth) &&
      hasText(student.gender) &&
      hasText(student.current_address_pincode) &&
      hasText(student.current_address) &&
      hasText(student.permanent_address_pincode) &&
      hasText(student.permanent_address) &&
      hasText(student.branch_specialisation) &&
      student.cgpa !== null
  );
}

export async function requireStudent(options: { allowIncomplete?: boolean } = {}): Promise<StudentContext> {
  const profile = await requireRole("student");
  const student = await getStudentByProfileId(profile.id);

  if (!student) {
    redirect("/student/profile");
  }

  if (!options.allowIncomplete && !isStudentProfileComplete(student, profile)) {
    redirect("/student/profile");
  }

  return { profile, student };
}