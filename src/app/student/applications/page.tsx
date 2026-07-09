import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StatusBadge } from "@/components/student/StatusBadge";
import { studentNavigation } from "@/lib/rbac";
import { requireStudent } from "@/lib/student/guards";
import { getStudentApplications } from "@/lib/student/queries";
import type { ApplicationStatus } from "@/types/student";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function EmptyStatus() {
  return <span className="text-sm font-semibold text-portal-muted">-</span>;
}

function StudentStatus({ status }: { status: ApplicationStatus }) {
  return status === "pending" ? <EmptyStatus /> : <StatusBadge status={status} />;
}

function TestAttendedStatus({ value }: { value: boolean | null }) {
  if (value === null) return <EmptyStatus />;

  return (
    <span className={`inline-flex min-h-7 items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${value ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-red-200 bg-red-50 text-red-700"}`}>
      {value ? "Yes" : "No"}
    </span>
  );
}

export default async function StudentApplicationsPage() {
  const { profile, student } = await requireStudent();
  const applications = await getStudentApplications(student.id);

  return (
    <PortalShell
      navigation={studentNavigation}
      profile={profile}
      subtitle="Track resume shortlist, test attendance, test shortlist, group discussion, and final offer status."
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
            <table className="w-full min-w-[1080px] border-collapse text-left text-sm">
              <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Company</th>
                  <th className="px-4 py-3 font-semibold">Role</th>
                  <th className="px-4 py-3 font-semibold">Resume Used</th>
                  <th className="px-4 py-3 font-semibold">Applied</th>
                  <th className="px-4 py-3 font-semibold">Resume Shortlist</th>
                  <th className="px-4 py-3 font-semibold">Test Attended</th>
                  <th className="px-4 py-3 font-semibold">Test Shortlist</th>
                  <th className="px-4 py-3 font-semibold">GD Shortlist</th>
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
                    <td className="px-4 py-4"><StudentStatus status={application.resume_shortlist_status} /></td>
                    <td className="px-4 py-4"><TestAttendedStatus value={application.test_attended} /></td>
                    <td className="px-4 py-4"><StudentStatus status={application.test_status} /></td>
                    <td className="px-4 py-4"><StudentStatus status={application.gd_status} /></td>
                    <td className="px-4 py-4"><StudentStatus status={application.offer_status} /></td>
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