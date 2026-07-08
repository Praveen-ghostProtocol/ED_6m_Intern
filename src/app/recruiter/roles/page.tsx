import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { requireRole } from "@/lib/auth/guards";
import { getAssignedRolesForRecruiter, getRecruiterByProfileId } from "@/lib/recruiter/queries";
import { recruiterNavigation } from "@/lib/rbac";

export const dynamic = "force-dynamic";

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "No deadline";
}

const roleStatusStyle = {
  draft: "bg-slate-50 text-slate-700 border-slate-200",
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-red-50 text-red-700 border-red-200"
};

export default async function RecruiterRolesPage() {
  const profile = await requireRole("recruiter");
  const recruiter = await getRecruiterByProfileId(profile.id);
  const roles = recruiter ? await getAssignedRolesForRecruiter(recruiter.id) : [];

  return (
    <PortalShell navigation={recruiterNavigation} profile={profile} subtitle="View roles assigned to your recruiter account." title="Assigned Roles">
      {!recruiter ? (
        <EmptyState title="Recruiter profile not found" description="Ask the internship organizer to link this login to a company." />
      ) : roles.length === 0 ? (
        <EmptyState title="No assigned roles" description="Assigned company roles will appear here after the organizer links them to your account." />
      ) : (
        <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[920px] text-left text-sm">
              <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
                <tr>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Role</th>
                  <th className="px-4 py-3">Location</th>
                  <th className="px-4 py-3">Duration</th>
                  <th className="px-4 py-3">Stipend</th>
                  <th className="px-4 py-3">Deadline</th>
                  <th className="px-4 py-3">GD</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-line">
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="px-4 py-4 font-semibold">{role.company_name}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.title}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.location ?? "-"}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.duration ?? "-"}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.stipend ?? "-"}</td>
                    <td className="px-4 py-4 text-portal-muted">{formatDate(role.deadline)}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.gd_applicable ? "Yes" : "No"}</td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${roleStatusStyle[role.status]}`}>{role.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PortalShell>
  );
}