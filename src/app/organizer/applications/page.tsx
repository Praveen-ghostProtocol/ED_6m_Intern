import Link from "next/link";
import { updateApplicationStage } from "@/app/organizer/actions";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StatusBadge } from "@/components/student/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { organizerNavigation } from "@/lib/rbac";
import { getAllApplicationsForOrganizer, getRolesForOrganizer } from "@/lib/organizer/queries";
import type { OrganizerApplication, OrganizerRole } from "@/types/organizer";
import type { ApplicationStatus } from "@/types/student";

export const dynamic = "force-dynamic";

const statuses: ApplicationStatus[] = ["pending", "shortlisted", "rejected", "not_applicable", "selected", "offer_given"];
const statusLabels: Record<ApplicationStatus, string> = { pending: "Pending", shortlisted: "Shortlisted", rejected: "Rejected", not_applicable: "Not Applicable", selected: "Selected", offer_given: "Offer Given" };

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function isPendingDecision(application: OrganizerApplication) {
  return (
    application.resume_shortlist_status === "pending" ||
    application.test_status === "pending" ||
    application.offer_status === "pending" ||
    (application.gd_applicable && application.gd_status === "pending")
  );
}

function StageForm({ applicationId, fieldName, value, disabledStatuses = [] }: { applicationId: string; fieldName: string; value: ApplicationStatus; disabledStatuses?: ApplicationStatus[] }) {
  return (
    <form action={updateApplicationStage} className="mt-2 flex gap-2"><input name="applicationId" type="hidden" value={applicationId} /><input name="fieldName" type="hidden" value={fieldName} /><select className="h-8 rounded-portal border border-portal-line px-2 text-xs" name="status" defaultValue={value}>{statuses.filter((status) => !disabledStatuses.includes(status)).map((status) => <option key={status} value={status}>{statusLabels[status]}</option>)}</select><button className="h-8 rounded-portal border border-portal-line px-2 text-xs font-semibold text-portal-blue" type="submit">Save</button></form>
  );
}

function RoleCards({ applications, roles }: { applications: OrganizerApplication[]; roles: OrganizerRole[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => {
        const roleApplications = applications.filter((application) => application.role_id === role.id);
        const pendingCount = roleApplications.filter(isPendingDecision).length;
        const offerCount = roleApplications.filter((application) => application.offer_status === "offer_given").length;

        return (
          <Link className="rounded-portal border border-portal-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-portal-blue hover:shadow-md" href={`/organizer/applications?roleId=${role.id}`} key={role.id}>
            <p className="text-sm font-semibold text-portal-teal">{role.company_name}</p>
            <h2 className="mt-1 text-lg font-semibold text-portal-ink">{role.title}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-portal-muted">Applications</dt><dd className="mt-1 font-semibold">{roleApplications.length}</dd></div>
              <div><dt className="text-portal-muted">Pending</dt><dd className="mt-1 font-semibold">{pendingCount}</dd></div>
              <div><dt className="text-portal-muted">Offers</dt><dd className="mt-1 font-semibold">{offerCount}</dd></div>
              <div><dt className="text-portal-muted">Status</dt><dd className="mt-1 font-semibold capitalize">{role.status}</dd></div>
            </dl>
          </Link>
        );
      })}
    </div>
  );
}

function ApplicationCard({ application }: { application: OrganizerApplication }) {
  return (
    <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={application.id}>
      <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{application.student_name ?? application.student_email}</h2>
          <p className="mt-1 text-sm text-portal-muted">{application.student_roll_number} - {application.resume_file_name} - applied {formatDate(application.applied_at)}</p>
          <p className="mt-1 text-xs text-portal-muted">{application.student_email}</p>
        </div>
      </div>
      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div><p className="text-xs font-semibold uppercase text-portal-muted">Resume</p><div className="mt-2"><StatusBadge status={application.resume_shortlist_status} /></div><StageForm applicationId={application.id} fieldName="resume_shortlist_status" value={application.resume_shortlist_status} disabledStatuses={["not_applicable", "selected", "offer_given"]} /></div>
        <div><p className="text-xs font-semibold uppercase text-portal-muted">Test</p><div className="mt-2"><StatusBadge status={application.test_status} /></div><StageForm applicationId={application.id} fieldName="test_status" value={application.test_status} disabledStatuses={["not_applicable", "selected", "offer_given"]} /></div>
        <div><p className="text-xs font-semibold uppercase text-portal-muted">GD</p><div className="mt-2"><StatusBadge status={application.gd_status} /></div><StageForm applicationId={application.id} fieldName="gd_status" value={application.gd_status} disabledStatuses={application.gd_applicable ? ["selected", "offer_given"] : ["pending", "shortlisted", "rejected", "selected", "offer_given"]} /></div>
        <div><p className="text-xs font-semibold uppercase text-portal-muted">Offer</p><div className="mt-2"><StatusBadge status={application.offer_status} /></div><StageForm applicationId={application.id} fieldName="offer_status" value={application.offer_status} disabledStatuses={["not_applicable", "shortlisted"]} /></div>
      </div>
    </article>
  );
}

export default async function OrganizerApplicationsPage({ searchParams }: { searchParams: Promise<{ q?: string; roleId?: string }> }) {
  const profile = await requireRole("organizer");
  const params = await searchParams;
  const [roles, allApplications] = await Promise.all([getRolesForOrganizer(), getAllApplicationsForOrganizer()]);
  const selectedRole = roles.find((role) => role.id === params.roleId) ?? null;

  if (!selectedRole) {
    return (
      <PortalShell navigation={organizerNavigation} profile={profile} subtitle="Choose a company role to review its applicants." title="Applications">
        {roles.length === 0 ? <EmptyState title="No roles found" description="Company roles will appear here after they are created." /> : <RoleCards applications={allApplications} roles={roles} />}
      </PortalShell>
    );
  }

  const q = (params.q ?? "").trim().toLowerCase();
  const applications = allApplications.filter((application) => {
    if (application.role_id !== selectedRole.id) return false;
    if (!q) return true;
    return [application.student_email, application.student_roll_number, application.student_name ?? ""].some((value) => value.toLowerCase().includes(q));
  });

  return (
    <PortalShell navigation={organizerNavigation} profile={profile} subtitle={`${selectedRole.company_name} - ${selectedRole.title}`} title="Applications">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link className="text-sm font-semibold text-portal-blue" href="/organizer/applications">Back to roles</Link>
        <form className="flex max-w-lg gap-2" action="/organizer/applications">
          <input name="roleId" type="hidden" value={selectedRole.id} />
          <input className="h-10 flex-1 rounded-portal border border-portal-line px-3 text-sm" name="q" placeholder="Search student" defaultValue={params.q ?? ""} />
          <button className="h-10 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white" type="submit">Search</button>
        </form>
      </div>
      {applications.length === 0 ? <EmptyState title="No applications found" description="Student applications for this role will appear after students register." /> : (
        <div className="space-y-4">{applications.map((application) => <ApplicationCard application={application} key={application.id} />)}</div>
      )}
    </PortalShell>
  );
}