import { PortalShell } from "@/components/portal/PortalShell";
import { CompanyRolesTable } from "@/components/student/CompanyRolesTable";
import { EmptyState } from "@/components/student/EmptyState";
import { studentNavigation } from "@/lib/rbac";
import { requireStudent } from "@/lib/student/guards";
import {
  getOpenCompanyRoles,
  getVerifiedResumeChoices
} from "@/lib/student/queries";

export const dynamic = "force-dynamic";

export default async function StudentCompaniesPage() {
  const { profile, student } = await requireStudent();

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
        <CompanyRolesTable applicationsLocked={student.has_offer} roles={roles} verifiedResumes={verifiedResumes} />
      )}
    </PortalShell>
  );
}
