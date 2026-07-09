import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { requireRole } from "@/lib/auth/guards";
import { getAssignedRolesForRecruiter, getRecruiterByProfileId } from "@/lib/recruiter/queries";
import { recruiterNavigation } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function RecruiterProfilePage() {
  const profile = await requireRole("recruiter");
  const recruiter = await getRecruiterByProfileId(profile.id);
  const roles = recruiter ? await getAssignedRolesForRecruiter(recruiter.id) : [];

  return (
    <PortalShell navigation={recruiterNavigation} profile={profile} subtitle="View your company account and roles." title="Company Account">
      {!recruiter ? (
        <EmptyState title="Company profile not found" description="Ask the internship organizer to link this login to a company." />
      ) : (
        <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <section className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Account Details</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Name</dt><dd className="mt-1">{recruiter.full_name ?? "Not provided"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Email</dt><dd className="mt-1">{recruiter.email}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Company</dt><dd className="mt-1">{recruiter.company_name}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Designation</dt><dd className="mt-1">{recruiter.designation ?? "Not provided"}</dd></div>
              <div><dt className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Account Status</dt><dd className="mt-1">{recruiter.is_active ? "Active" : "Inactive"}</dd></div>
            </dl>
          </section>

          <section className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold">Company Roles</h2>
            {roles.length === 0 ? (
              <p className="mt-4 text-sm text-portal-muted">No company roles yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {roles.map((role) => (
                  <li className="rounded-portal border border-portal-line px-4 py-3" key={role.id}>
                    <p className="text-sm font-semibold">{role.title}</p>
                    <p className="mt-1 text-xs text-portal-muted">{role.company_name} - {role.status} - GD {role.gd_applicable ? "applicable" : "not applicable"}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      )}
    </PortalShell>
  );
}