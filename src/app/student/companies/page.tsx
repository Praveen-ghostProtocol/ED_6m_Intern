import { PortalShell } from "@/components/portal/PortalShell";
import { CompanyRolesTable } from "@/components/student/CompanyRolesTable";
import { EmptyState } from "@/components/student/EmptyState";
import { requireRole } from "@/lib/auth/guards";
import { studentNavigation } from "@/lib/rbac";
import {
  getOpenCompanyRoles,
  getStudentByProfileId,
  getVerifiedResumeChoices
} from "@/lib/student/queries";

export const dynamic = "force-dynamic";

export default async function StudentCompaniesPage() {
  const profile = await requireRole("student");
  const student = await getStudentByProfileId(profile.id);

  if (!student) {
    return (
      <PortalShell
        navigation={studentNavigation}
        profile={profile}
        subtitle="Browse open internship roles and register with a verified resume."
        title="Companies"
      >
        <EmptyState
          description="Your student profile must be imported before company registrations can open."
          title="Student profile not found"
        />
      </PortalShell>
    );
  }

  const [roles, verifiedResumes] = await Promise.all([
    getOpenCompanyRoles(student.id),
    getVerifiedResumeChoices(student.id)
  ]);

  return (
    <PortalShell
      navigation={studentNavigation}
      profile={profile}
      subtitle="Browse open roles, view job descriptions, and register using verified resumes."
      title="Companies"
    >
      {roles.length === 0 ? (
        <EmptyState
          description="Open company roles will appear here after the internship organizer publishes them."
          title="No open roles yet"
        />
      ) : (
        <CompanyRolesTable roles={roles} verifiedResumes={verifiedResumes} />
      )}
    </PortalShell>
  );
}