import { ExternalLink } from "lucide-react";
import { rejectAssignedResume, verifyAssignedResume } from "@/app/verifier/actions";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StatusBadge } from "@/components/student/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { verifierNavigation } from "@/lib/rbac";
import { getResumesForVerifier } from "@/lib/verifier/queries";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function VerifierResumesPage() {
  const profile = await requireRole("verifier");
  const resumes = await getResumesForVerifier(profile.id);

  return (
    <PortalShell navigation={verifierNavigation} profile={profile} subtitle="Review PDF resumes uploaded by assigned students." title="My Resumes Verification">
      {resumes.length === 0 ? <EmptyState title="No PDF resumes" description="Uploaded resumes from assigned students will appear here." /> : (
        <div className="grid gap-4">
          {resumes.map((resume) => (
            <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={resume.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-semibold">{resume.file_name}</h2><StatusBadge status={resume.status} /></div>
                  <p className="mt-2 text-sm text-portal-muted">{resume.student_name ?? resume.student_email} - {resume.student_roll_number} - {formatBytes(resume.file_size_bytes)} - uploaded {formatDate(resume.uploaded_at)}</p>
                </div>
                {resume.signed_url ? <a className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky" href={resume.signed_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" aria-hidden="true" />View Resume</a> : <span className="text-sm text-portal-muted">Resume link unavailable</span>}
              </div>
              {resume.verification_note ? <p className="mt-3 text-sm text-portal-muted">Comment: {resume.verification_note}</p> : null}
              {resume.status === "pending" ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <form action={verifyAssignedResume} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="resumeId" type="hidden" value={resume.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Optional comment" /><button className="h-10 rounded-portal bg-portal-teal px-4 text-sm font-semibold text-white" type="submit">Verify</button></form>
                  <form action={rejectAssignedResume} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="resumeId" type="hidden" value={resume.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Rejection comment" /><button className="h-10 rounded-portal border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700" type="submit">Reject</button></form>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}