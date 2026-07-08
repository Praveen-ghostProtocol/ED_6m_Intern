import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StatusBadge } from "@/components/student/StatusBadge";
import { studentNavigation } from "@/lib/rbac";
import { requireStudent } from "@/lib/student/guards";
import { getStudentApplications } from "@/lib/student/queries";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default async function StudentApplicationsPage() {
  const { profile, student } = await requireStudent();
  const applications = await getStudentApplications(student.id);

  return (
    <PortalShell
      navigation={studentNavigation}
      profile={profile}
      subtitle="Track resume shortlist, test, group discussion, and final offer status."
      title="Applied Companies"
    >
      {applications.length === 0 ? (
        <EmptyState
          description="Applications submitted through the Companies tab will appear here."
          title="No applications submitted yet"
        />
      ) : (
        <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Resume Used</th>
                  <th className="px-4 py-3 font-semibold">Applied</th>
                  <th className="px-4 py-3 font-semibold">Resume</th>
                  <th className="px-4 py-3 font-semibold">Test</th>
                  <th className="px-4 py-3 font-semibold">GD</th>
                  <th className="px-4 py-3 font-semibold">Offer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-line">
                {applications.map((application) => (
                  <tr key={application.id}>
                    <td className="px-4 py-4 font-semibold text-portal-ink">{application.company_name}</td>
                    <td className="px-4 py-4 text-portal-muted">{application.role_title}</td>
                    <td className="px-4 py-4 text-portal-muted">{application.resume_file_name}</td>
                    <td className="px-4 py-4 text-portal-muted">{formatDate(application.applied_at)}</td>
                    <td className="px-4 py-4"><StatusBadge status={application.resume_shortlist_status} /></td>
                    <td className="px-4 py-4"><StatusBadge status={application.test_status} /></td>
                    <td className="px-4 py-4"><StatusBadge status={application.gd_status} /></td>
                    <td className="px-4 py-4"><StatusBadge status={application.offer_status} /></td>
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