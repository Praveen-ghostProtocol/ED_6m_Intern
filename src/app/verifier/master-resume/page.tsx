import { ExternalLink } from "lucide-react";
import { rejectMasterResumeEntry, verifyMasterResumeEntry } from "@/app/verifier/actions";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StatusBadge } from "@/components/student/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { verifierNavigation } from "@/lib/rbac";
import { getMasterResumeEntriesForVerifier } from "@/lib/verifier/queries";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function VerifierMasterResumePage() {
  const profile = await requireRole("verifier");
  const entries = await getMasterResumeEntriesForVerifier(profile.id);

  return (
    <PortalShell navigation={verifierNavigation} profile={profile} subtitle="Approve or reject resume points for assigned students." title="Master Resume Verification">
      {entries.length === 0 ? <EmptyState title="No master resume entries" description="Entries submitted by assigned students will appear here." /> : (
        <div className="grid gap-4">
          {entries.map((entry) => (
            <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={entry.id}>
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-3"><h2 className="text-lg font-semibold">{entry.title}</h2><StatusBadge status={entry.status} /></div>
                  <p className="mt-2 text-sm text-portal-muted">{entry.student_name ?? entry.student_email} - {entry.student_roll_number} - submitted {formatDate(entry.created_at)}</p>
                </div>
                {entry.link ? <a className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky" href={entry.link} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" aria-hidden="true" />Open Link</a> : null}
              </div>
              <p className="mt-4 whitespace-pre-wrap rounded-portal bg-portal-canvas px-4 py-3 text-sm leading-6 text-portal-muted">{entry.description}</p>
              {entry.verification_note ? <p className="mt-3 text-sm text-portal-muted">Comment: {entry.verification_note}</p> : null}
              {entry.status === "pending" ? (
                <div className="mt-4 grid gap-3 lg:grid-cols-2">
                  <form action={verifyMasterResumeEntry} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="entryId" type="hidden" value={entry.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Optional comment" /><button className="h-10 rounded-portal bg-portal-teal px-4 text-sm font-semibold text-white" type="submit">Verify</button></form>
                  <form action={rejectMasterResumeEntry} className="grid gap-3 md:grid-cols-[1fr_auto]"><input name="entryId" type="hidden" value={entry.id} /><input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verificationNote" placeholder="Rejection comment" /><button className="h-10 rounded-portal border border-red-200 bg-red-50 px-4 text-sm font-semibold text-red-700" type="submit">Reject</button></form>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
    </PortalShell>
  );
}