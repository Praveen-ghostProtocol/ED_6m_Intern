import { ExternalLink } from "lucide-react";
import {
  rejectMasterResumeEntryAsOrganizer,
  rejectResume,
  verifyMasterResumeEntryAsOrganizer,
  verifyResume
} from "@/app/organizer/actions";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StatusBadge } from "@/components/student/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { organizerNavigation } from "@/lib/rbac";
import { getPendingMasterResumeEntriesForOrganizer, getPendingResumesForOrganizer } from "@/lib/organizer/queries";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default async function OrganizerResumesPage() {
  const profile = await requireRole("organizer");
  const [resumes, masterEntries] = await Promise.all([
    getPendingResumesForOrganizer(),
    getPendingMasterResumeEntriesForOrganizer()
  ]);

  return (
    <PortalShell navigation={organizerNavigation} profile={profile} subtitle="Review pending PDF resumes and master resume entries when verifier override is needed." title="Resume Verification">
      <div className="space-y-8">
        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">PDF Resumes</h2>
              <p className="mt-1 text-sm text-portal-muted">Uploaded files from My Resumes that are still pending.</p>
            </div>
          </div>
          {resumes.length === 0 ? <EmptyState title="No pending PDF resumes" description="Uploaded resumes that need verification will appear here." /> : (
            <div className="grid gap-4">
              {resumes.map((resume) => (
                <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={resume.id}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-semibold">{resume.file_name}</h3><StatusBadge status={resume.status} /></div>
                      <p className="mt-2 text-sm text-portal-muted">{resume.student_name ?? resume.student_email} - {resume.student_roll_number} - {formatBytes(resume.file_size_bytes)} - uploaded {formatDate(resume.uploaded_at)}</p>
                    </div>
                    {resume.signed_url ? <a className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky" href={resume.signed_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" aria-hidden="true" />View Resume</a> : <span className="text-sm text-portal-muted">Resume link unavailable</span>}
                  </div>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <form action={verifyResume} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="resumeId" type="hidden" value={resume.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Optional comment" /><button className="h-10 rounded-portal bg-portal-teal px-4 text-sm font-semibold text-white" type="submit">Verify</button></form>
                    <form action={rejectResume} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="resumeId" type="hidden" value={resume.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Rejection comment" /><button className="h-10 rounded-portal border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700" type="submit">Reject</button></form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section>
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold">Master Resume Entries</h2>
              <p className="mt-1 text-sm text-portal-muted">Student-submitted resume points awaiting verification.</p>
            </div>
          </div>
          {masterEntries.length === 0 ? <EmptyState title="No pending master resume entries" description="Master resume submissions that need verification will appear here." /> : (
            <div className="grid gap-4">
              {masterEntries.map((entry) => (
                <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={entry.id}>
                  <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-3"><h3 className="text-lg font-semibold">{entry.title}</h3><StatusBadge status={entry.status} /></div>
                      <p className="mt-2 text-sm text-portal-muted">{entry.student_name ?? entry.student_email} - {entry.student_roll_number} - submitted {formatDate(entry.created_at)}</p>
                    </div>
                    {entry.link ? <a className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky" href={entry.link} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" aria-hidden="true" />Open Link</a> : null}
                  </div>
                  <p className="mt-4 whitespace-pre-wrap rounded-portal bg-portal-canvas px-4 py-3 text-sm leading-6 text-portal-muted">{entry.description}</p>
                  <div className="mt-4 grid gap-3 lg:grid-cols-2">
                    <form action={verifyMasterResumeEntryAsOrganizer} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="entryId" type="hidden" value={entry.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Optional comment" /><button className="h-10 rounded-portal bg-portal-teal px-4 text-sm font-semibold text-white" type="submit">Verify</button></form>
                    <form action={rejectMasterResumeEntryAsOrganizer} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="entryId" type="hidden" value={entry.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Rejection comment" /><button className="h-10 rounded-portal border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700" type="submit">Reject</button></form>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>
    </PortalShell>
  );
}