import { assignRecruiterToRole } from "@/app/organizer/actions";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { requireRole } from "@/lib/auth/guards";
import { organizerNavigation } from "@/lib/rbac";
import { getRecruitersForOrganizer, getRolesForOrganizer } from "@/lib/organizer/queries";

export const dynamic = "force-dynamic";

export default async function OrganizerRecruitersPage() {
  const profile = await requireRole("organizer");
  const [recruiters, roles] = await Promise.all([getRecruitersForOrganizer(), getRolesForOrganizer()]);

  return (
    <PortalShell navigation={organizerNavigation} profile={profile} subtitle="View company accounts and assign them to company roles." title="Company Accounts">
      <section className="mb-5 rounded-portal border border-portal-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Assign Company Account to Role</h2>
        <form action={assignRecruiterToRole} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="recruiterId" required>
            <option value="">Select company account</option>
            {recruiters.map((recruiter) => <option key={recruiter.id} value={recruiter.id}>{recruiter.email} - {recruiter.company_name}</option>)}
          </select>
          <select className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="roleId" required>
            <option value="">Select role</option>
            {roles.map((role) => <option key={role.id} value={role.id}>{role.company_name} - {role.title}</option>)}
          </select>
          <button className="h-10 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white" type="submit">Assign</button>
        </form>
        <p className="mt-3 text-sm text-portal-muted">Company account creation is handled by the provisioning workflow after Supabase is connected.</p>
      </section>
      {recruiters.length === 0 ? <EmptyState title="No company accounts yet" description="Company account profiles will appear here after account provisioning or manual setup." /> : (
        <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[840px] text-left text-sm">
              <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
                <tr><th className="px-4 py-3">Account</th><th className="px-4 py-3">Company</th><th className="px-4 py-3">Designation</th><th className="px-4 py-3">Company Roles</th></tr>
              </thead>
              <tbody className="divide-y divide-portal-line">
                {recruiters.map((recruiter) => <tr key={recruiter.id}><td className="px-4 py-4"><div className="font-semibold">{recruiter.full_name ?? recruiter.email}</div><div className="text-xs text-portal-muted">{recruiter.email}</div></td><td className="px-4 py-4 text-portal-muted">{recruiter.company_name}</td><td className="px-4 py-4 text-portal-muted">{recruiter.designation ?? "-"}</td><td className="px-4 py-4 text-portal-muted">{recruiter.assigned_roles.length > 0 ? recruiter.assigned_roles.join(", ") : "None"}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PortalShell>
  );
}