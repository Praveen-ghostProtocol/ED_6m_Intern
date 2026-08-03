import { ExternalLink } from "lucide-react";
import { CompanyDetailsEditor } from "@/components/recruiter/CompanyDetailsEditor";
import { CompanyRoleForm } from "@/components/recruiter/CompanyRoleForm";
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
    <PortalShell navigation={recruiterNavigation} profile={profile} subtitle="Create and manage roles for your company account." title="Company Roles">
      {!recruiter ? (
        <EmptyState title="Company profile not found" description="Ask the internship organizer to link this login to a company." />
      ) : (
        <div className="space-y-5">
          <CompanyDetailsEditor recruiter={recruiter} />
          <CompanyRoleForm />
          {roles.length === 0 ? (
            <EmptyState title="No roles created yet" description="Create your first company role above. Draft roles stay hidden from students until opened." />
          ) : (
            <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] text-left text-sm">
                  <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
                    <tr>
                      <th className="px-4 py-3">Company</th>
                      <th className="px-4 py-3">Role</th>
                      <th className="px-4 py-3">Location</th>
                      <th className="px-4 py-3">Duration</th>
                      <th className="px-4 py-3">Stipend</th>
                      <th className="px-4 py-3">JD</th>
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
                        <td className="px-4 py-4">
                          {role.jd_signed_url ? (
                            <a className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky" href={role.jd_signed_url} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" aria-hidden="true" />
                              View JD
                            </a>
                          ) : <span className="text-portal-muted">Text only</span>}
                        </td>
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
        </div>
      )}
    </PortalShell>
  );
}