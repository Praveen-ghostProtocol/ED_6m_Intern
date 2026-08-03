import { CompanyRoleForm } from "@/components/recruiter/CompanyRoleForm";
import { CompanyRolesManager } from "@/components/recruiter/CompanyRolesManager";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { requireRole } from "@/lib/auth/guards";
import { getAssignedRolesForRecruiter, getRecruiterByProfileId } from "@/lib/recruiter/queries";
import { recruiterNavigation } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function RecruiterRolesPage() {
  const profile = await requireRole("recruiter");
  const recruiter = await getRecruiterByProfileId(profile.id);
  const roles = recruiter ? await getAssignedRolesForRecruiter(recruiter.id) : [];

  return (
    <PortalShell navigation={recruiterNavigation} profile={profile} subtitle="Create and manage roles for your company account." title="Company Roles">
      {!recruiter ? (
        <EmptyState title="Company profile not found" description="Ask the internship organizer to link this login to a company." />
      ) : (
        <div className="space-y-5">
          <CompanyRoleForm />
          {roles.length === 0 ? (
            <EmptyState title="No roles created yet" description="Create your first company role above. Draft roles stay hidden from students until opened." />
          ) : (
            <CompanyRolesManager roles={roles} />
          )}
        </div>
      )}
    </PortalShell>
  );
}