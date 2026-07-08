import { ExternalLink } from "lucide-react";
import { verifyResume, rejectResume } from "@/app/organizer/actions";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StatusBadge } from "@/components/student/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { organizerNavigation } from "@/lib/rbac";
import { getPendingResumesForOrganizer } from "@/lib/organizer/queries";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default async function OrganizerResumesPage() {
  const profile = await requireRole("organizer");
  const resumes = await getPendingResumesForOrganizer();

  return (
    <PortalShell navigation={organizerNavigation} profile={profile} subtitle="Review pending student resumes and mark them verified or rejected." title="Resume Verification">
      {resumes.length === 0 ? <EmptyState title="No pending resumes" description="Uploaded resumes that need organizer verification will appear here." /> : (
        <div className="space-y-4">
          {resumes.map((resume) => (
            <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={resume.id}>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-semibold">{resume.file_name}</h2><StatusBadge status={resume.status} /></div>
                  <p className="mt-2 text-sm text-portal-muted">{resume.student_name ?? resume.student_email} · {resume.student_roll_number} · {formatBytes(resume.file_size_bytes)} · uploaded {formatDate(resume.uploaded_at)}</p>
                </div>
                {resume.signed_url ? <a className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky" href={resume.signed_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" aria-hidden="true" />View Resume</a> : <span className="text-sm text-portal-muted">Resume link unavailable</span>}
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-[auto_1fr_auto] md:items-end">
                <form action={verifyResume}><input name="resumeId" type="hidden" value={resume.id} /><button className="h-10 rounded-portal bg-portal-teal px-4 text-sm font-semibold text-white" type="submit">Verify</button></form>
                <form action={rejectResume} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="resumeId" type="hidden" value={resume.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Optional rejection note" /><button className="h-10 rounded-portal border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700" type="submit">Reject</button></form>
              </div>
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}