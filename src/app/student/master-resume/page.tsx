import { ExternalLink } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { MasterResumeEntryForm } from "@/components/student/MasterResumeEntryForm";
import { StatusBadge } from "@/components/student/StatusBadge";
import { studentNavigation } from "@/lib/rbac";
import { requireStudent } from "@/lib/student/guards";
import { getStudentMasterResumeEntries } from "@/lib/student/queries";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default async function StudentMasterResumePage() {
  const { profile, student } = await requireStudent();
  const entries = await getStudentMasterResumeEntries(student.id);

  return (
    <PortalShell
      navigation={studentNavigation}
      profile={profile}
      subtitle="Submit resume points for verification before you use them in your final resume."
      title="Master Resume"
    >
      <div className="space-y-5">
        <MasterResumeEntryForm />

        {entries.length === 0 ? (
          <EmptyState
            description="Submitted resume points will appear here with verifier status and comments."
            title="No master resume entries yet"
          />
        ) : (
          <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1100px] border-collapse text-left text-sm">
                <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Title</th>
                    <th className="px-4 py-3 font-semibold">Description</th>
                    <th className="px-4 py-3 font-semibold">Link</th>
                    <th className="px-4 py-3 font-semibold">Status</th>
                    <th className="px-4 py-3 font-semibold">Comments</th>
                    <th className="px-4 py-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-portal-line align-top">
                  {entries.map((entry) => (
                    <tr key={entry.id}>
                      <td className="w-56 px-4 py-4 font-semibold text-portal-ink">
                        <div>{entry.title}</div>
                        <p className="mt-1 text-xs font-normal text-portal-muted">Added {formatDate(entry.created_at)}</p>
                      </td>
                      <td className="min-w-[360px] whitespace-pre-wrap px-4 py-4 leading-6 text-portal-muted">{entry.description}</td>
                      <td className="w-72 px-4 py-4 text-portal-muted">
                        {entry.link ? (
                          <a className="inline-flex items-center gap-2 font-semibold text-portal-blue hover:underline" href={entry.link} rel="noreferrer" target="_blank">
                            Open link
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-4"><StatusBadge status={entry.status} /></td>
                      <td className="min-w-56 px-4 py-4 text-portal-muted">{entry.verification_note ?? "-"}</td>
                      <td className="min-w-[360px] px-4 py-4">
                        {entry.status === "rejected" ? (
                          <MasterResumeEntryForm entry={entry} />
                        ) : (
                          <span className="text-sm text-portal-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </PortalShell>
  );
}