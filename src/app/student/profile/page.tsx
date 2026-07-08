import { ClipboardCheck } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StudentProfileForm } from "@/components/student/StudentProfileForm";
import { requireRole } from "@/lib/auth/guards";
import { studentNavigation } from "@/lib/rbac";
import { isStudentProfileComplete } from "@/lib/student/guards";
import { getStudentByProfileId } from "@/lib/student/queries";

export const dynamic = "force-dynamic";

export default async function StudentProfilePage() {
  const profile = await requireRole("student");
  const student = await getStudentByProfileId(profile.id);

  if (!student) {
    return (
      <PortalShell
        navigation={studentNavigation}
        profile={profile}
        subtitle="Complete your personal and academic details."
        title="Profile"
      >
        <EmptyState
          title="Student profile not found"
          description="Ask the internship organizer to import your student record before completing your profile."
        />
      </PortalShell>
    );
  }

  const isComplete = isStudentProfileComplete(student, profile);

  return (
    <PortalShell
      navigation={studentNavigation}
      profile={profile}
      subtitle="Complete personal, contact, address, and academic details before using the portal."
      title="Profile"
    >
      <div className="mb-5 flex items-start gap-3 rounded-portal border border-portal-line bg-white p-4 text-sm text-portal-muted shadow-sm">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-portal bg-portal-mint text-portal-teal">
          <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
        </div>
        <div>
          <p className="font-semibold text-portal-ink">{isComplete ? "Profile complete" : "Profile completion required"}</p>
          <p className="mt-1">
            {isComplete
              ? "You can update your details here whenever needed. Email and roll number remain read-only."
              : "Please fill this once to unlock resumes, companies, and application tracking."}
          </p>
        </div>
      </div>
      <StudentProfileForm profile={profile} student={student} />
    </PortalShell>
  );
}