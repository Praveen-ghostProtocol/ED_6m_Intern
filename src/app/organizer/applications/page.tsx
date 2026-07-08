import { updateApplicationStage } from "@/app/organizer/actions";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StatusBadge } from "@/components/student/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { organizerNavigation } from "@/lib/rbac";
import { getAllApplicationsForOrganizer } from "@/lib/organizer/queries";
import type { ApplicationStatus } from "@/types/student";

export const dynamic = "force-dynamic";

const statuses: ApplicationStatus[] = ["pending", "shortlisted", "rejected", "not_applicable", "selected", "offer_given"];
const statusLabels: Record<ApplicationStatus, string> = { pending: "Pending", shortlisted: "Shortlisted", rejected: "Rejected", not_applicable: "Not Applicable", selected: "Selected", offer_given: "Offer Given" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function StageForm({ applicationId, fieldName, value, disabledStatuses = [] }: { applicationId: string; fieldName: string; value: ApplicationStatus; disabledStatuses?: ApplicationStatus[] }) {
  return (
    <form action={updateApplicationStage} className="mt-2 flex gap-2"><input name="applicationId" type="hidden" value={applicationId} /><input name="fieldName" type="hidden" value={fieldName} /><select className="h-8 rounded-portal border border-portal-line px-2 text-xs" name="status" defaultValue={value}>{statuses.filter((status) => !disabledStatuses.includes(status)).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select><button className="h-8 rounded-portal border border-portal-line px-2 text-xs font-semibold text-portal-blue" type="submit">Save</button></form>
  );
}

export default async function OrganizerApplicationsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const profile = await requireRole("organizer");
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const applications = (await getAllApplicationsForOrganizer()).filter((application) => {
    if (!q) return true;
    return [application.company_name, application.role_title, application.student_email, application.student_roll_number].some((value) => value.toLowerCase().includes(q));
  });

  return (
    <PortalShell navigation={organizerNavigation} profile={profile} subtitle="View applications and update selection stages on behalf of recruiters." title="Applications">
      <form className="mb-5 flex max-w-lg gap-2" action="/organizer/applications"><input className="h-10 flex-1 rounded-portal border border-portal-line px-3 text-sm" name="q" placeholder="Search company, role, student" defaultValue={params.q ?? ""} /><button className="h-10 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white" type="submit">Search</button></form>
      {applications.length === 0 ? <EmptyState title="No applications found" description="Student applications will appear here after students register for roles." /> : (
        <div className="space-y-4">{applications.map((application) => <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={application.id}><div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between"><div><h2 className="text-lg font-semibold">{application.company_name} · {application.role_title}</h2><p className="mt-1 text-sm text-portal-muted">{application.student_name ?? application.student_email} · {application.student_roll_number} · {application.resume_file_name} · applied {formatDate(application.applied_at)}</p></div></div><div className="mt-5 grid gap-4 md:grid-cols-4"><div><p className="text-xs font-semibold uppercase text-portal-muted">Resume</p><div className="mt-2"><StatusBadge status={application.resume_shortlist_status} /></div><StageForm applicationId={application.id} fieldName="resume_shortlist_status" value={application.resume_shortlist_status} disabledStatuses={["not_applicable", "selected", "offer_given"]} /></div><div><p className="text-xs font-semibold uppercase text-portal-muted">Test</p><div className="mt-2"><StatusBadge status={application.test_status} /></div><StageForm applicationId={application.id} fieldName="test_status" value={application.test_status} disabledStatuses={["not_applicable", "selected", "offer_given"]} /></div><div><p className="text-xs font-semibold uppercase text-portal-muted">GD</p><div className="mt-2"><StatusBadge status={application.gd_status} /></div><StageForm applicationId={application.id} fieldName="gd_status" value={application.gd_status} disabledStatuses={application.gd_applicable ? ["selected", "offer_given"] : ["pending", "shortlisted", "rejected", "selected", "offer_given"]} /></div><div><p className="text-xs font-semibold uppercase text-portal-muted">Offer</p><div className="mt-2"><StatusBadge status={application.offer_status} /></div><StageForm applicationId={application.id} fieldName="offer_status" value={application.offer_status} disabledStatuses={["not_applicable", "shortlisted"]} /></div></div></article>)}</div>
      )}
    </PortalShell>
  );
}