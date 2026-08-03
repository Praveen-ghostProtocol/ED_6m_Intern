import Link from "next/link";
import { notFound } from "next/navigation";
import { ExternalLink } from "lucide-react";
import { rejectAssignedResume, rejectMasterResumeEntry, verifyAssignedResume, verifyMasterResumeEntry } from "@/app/verifier/actions";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StatusBadge } from "@/components/student/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { verifierNavigation } from "@/lib/rbac";
import { getAssignedStudentDetailForVerifier } from "@/lib/verifier/queries";
import type { VerifierMasterResumeEntry, VerifierResume } from "@/types/verifier";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function MasterEntryCard({ entry }: { entry: VerifierMasterResumeEntry }) {
  return (
    <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-semibold">{entry.title}</h2><StatusBadge status={entry.status} /></div>
          <p className="mt-2 text-sm text-portal-muted">Submitted {formatDate(entry.created_at)}</p>
        </div>
        {entry.link ? <a className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky" href={entry.link} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" aria-hidden="true" />Open Link</a> : null}
      </div>
      <p className="mt-4 whitespace-pre-wrap rounded-portal bg-portal-canvas px-4 py-3 text-sm leading-6 text-portal-muted">{entry.description}</p>
      {entry.verification_note ? <p className="mt-3 text-sm text-portal-muted">Comment: {entry.verification_note}</p> : null}
      {entry.status === "pending" ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <form action={verifyMasterResumeEntry} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="studentId" type="hidden" value={entry.student_id} /><input name="entryId" type="hidden" value={entry.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Optional comment" /><button className="h-10 rounded-portal bg-portal-teal px-4 text-sm font-semibold text-white" type="submit">Verify</button></form>
          <form action={rejectMasterResumeEntry} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="studentId" type="hidden" value={entry.student_id} /><input name="entryId" type="hidden" value={entry.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Rejection comment" /><button className="h-10 rounded-portal border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700" type="submit">Reject</button></form>
        </div>
      ) : null}
    </article>
  );
}

function ResumeCard({ resume }: { resume: VerifierResume }) {
  return (
    <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-semibold">{resume.file_name}</h2><StatusBadge status={resume.status} /></div>
          <p className="mt-2 text-sm text-portal-muted">{formatBytes(resume.file_size_bytes)} - uploaded {formatDate(resume.uploaded_at)}</p>
        </div>
        {resume.signed_url ? <a className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky" href={resume.signed_url} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" aria-hidden="true" />View Resume</a> : <span className="text-sm text-portal-muted">Resume link unavailable</span>}
      </div>
      {resume.verification_note ? <p className="mt-3 text-sm text-portal-muted">Comment: {resume.verification_note}</p> : null}
      {resume.status === "pending" ? (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <form action={verifyAssignedResume} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="studentId" type="hidden" value={resume.student_id} /><input name="resumeId" type="hidden" value={resume.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Optional comment" /><button className="h-10 rounded-portal bg-portal-teal px-4 text-sm font-semibold text-white" type="submit">Verify</button></form>
          <form action={rejectAssignedResume} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="studentId" type="hidden" value={resume.student_id} /><input name="resumeId" type="hidden" value={resume.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Rejection comment" /><button className="h-10 rounded-portal border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700" type="submit">Reject</button></form>
        </div>
      ) : null}
    </article>
  );
}

export default async function VerifierStudentDetailPage({ params }: { params: Promise<{ studentId: string }> }) {
  const profile = await requireRole("verifier");
  const { studentId } = await params;
  const student = await getAssignedStudentDetailForVerifier(profile.id, studentId);

  if (!student) notFound();

  return (
    <PortalShell navigation={verifierNavigation} profile={profile} subtitle={`${student.roll_number} - ${student.full_name ?? student.email}`} title="Candidate Materials">
      <div className="mb-5 flex flex-col gap-2 rounded-portal border border-portal-line bg-white p-5 shadow-sm md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{student.full_name ?? student.email}</h2>
          <p className="mt-1 text-sm text-portal-muted">{student.email} - CGPA {student.cgpa ?? "-"} - {student.branch_specialisation ?? "-"}</p>
        </div>
        <Link className="text-sm font-semibold text-portal-blue" href="/verifier/students">Back to assigned students</Link>
      </div>

      <section className="space-y-4">
        <h2 className="text-base font-semibold">Master Resume Entries</h2>
        {student.master_entries.length === 0 ? <EmptyState title="No master resume entries" description="This student has not submitted master resume entries yet." /> : student.master_entries.map((entry) => <MasterEntryCard entry={entry} key={entry.id} />)}
      </section>

      <section className="mt-6 space-y-4">
        <h2 className="text-base font-semibold">PDF Resumes</h2>
        {student.resumes.length === 0 ? <EmptyState title="No PDF resumes" description="This student has not uploaded fixed resumes yet." /> : student.resumes.map((resume) => <ResumeCard resume={resume} key={resume.id} />)}
      </section>
    </PortalShell>
  );
}