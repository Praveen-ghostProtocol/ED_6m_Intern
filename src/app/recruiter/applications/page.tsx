import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { RecruiterStageForm } from "@/components/recruiter/RecruiterStageForm";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StatusBadge } from "@/components/student/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import {
  getApplicationsForRecruiter,
  getAssignedRolesForRecruiter,
  getRecruiterByProfileId
} from "@/lib/recruiter/queries";
import { recruiterNavigation } from "@/lib/rbac";
import type { RecruiterApplication, RecruiterRole } from "@/types/recruiter";
import type { ApplicationStatus } from "@/types/student";

export const dynamic = "force-dynamic";

const statusOptions: ApplicationStatus[] = ["pending", "shortlisted", "rejected", "not_applicable", "selected", "offer_given"];
const statusLabels: Record<ApplicationStatus, string> = {
  pending: "Pending",
  shortlisted: "Shortlisted",
  rejected: "Rejected",
  not_applicable: "Not Applicable",
  selected: "Selected",
  offer_given: "Offer Given"
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

function isPendingDecision(application: RecruiterApplication) {
  return (
    application.resume_shortlist_status === "pending" ||
    application.test_status === "pending" ||
    application.offer_status === "pending" ||
    (application.gd_applicable && application.gd_status === "pending")
  );
}

function RoleCards({ applications, roles }: { applications: RecruiterApplication[]; roles: RecruiterRole[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {roles.map((role) => {
        const roleApplications = applications.filter((application) => application.role_id === role.id);
        const pendingCount = roleApplications.filter(isPendingDecision).length;

        return (
          <Link className="rounded-portal border border-portal-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-portal-blue hover:shadow-md" href={`/recruiter/applications?roleId=${role.id}`} key={role.id}>
            <p className="text-sm font-semibold text-portal-teal">{role.company_name}</p>
            <h2 className="mt-1 text-lg font-semibold text-portal-ink">{role.title}</h2>
            <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
              <div><dt className="text-portal-muted">Applicants</dt><dd className="mt-1 font-semibold">{roleApplications.length}</dd></div>
              <div><dt className="text-portal-muted">Pending</dt><dd className="mt-1 font-semibold">{pendingCount}</dd></div>
              <div><dt className="text-portal-muted">Status</dt><dd className="mt-1 font-semibold capitalize">{role.status}</dd></div>
              <div><dt className="text-portal-muted">GD</dt><dd className="mt-1 font-semibold">{role.gd_applicable ? "Yes" : "No"}</dd></div>
            </dl>
          </Link>
        );
      })}
    </div>
  );
}

function ApplicationCard({ application }: { application: RecruiterApplication }) {
  return (
    <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={application.id}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{application.student_name ?? application.student_email}</h2>
          <p className="mt-1 text-sm text-portal-muted">
            {application.student_roll_number} - CGPA {application.student_cgpa ?? "-"} - applied {formatDate(application.applied_at)}
          </p>
          <p className="mt-1 text-xs text-portal-muted">{application.student_email}</p>
        </div>
        {application.resume_signed_url ? (
          <a className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky" href={application.resume_signed_url} target="_blank" rel="noreferrer">
            <ExternalLink className="h-4 w-4" aria-hidden="true" />
            View Resume
          </a>
        ) : <span className="text-sm text-portal-muted">Resume unavailable</span>}
      </div>

      <div className="mt-5 grid gap-4 md:grid-cols-4">
        <div><p className="text-xs font-semibold uppercase text-portal-muted">Resume</p><div className="mt-2"><StatusBadge status={application.resume_shortlist_status} /></div><RecruiterStageForm applicationId={application.id} fieldName="resume_shortlist_status" value={application.resume_shortlist_status} /></div>
        <div><p className="text-xs font-semibold uppercase text-portal-muted">Test</p><div className="mt-2"><StatusBadge status={application.test_status} /></div><RecruiterStageForm applicationId={application.id} fieldName="test_status" value={application.test_status} /></div>
        <div><p className="text-xs font-semibold uppercase text-portal-muted">GD</p><div className="mt-2"><StatusBadge status={application.gd_status} /></div><RecruiterStageForm applicationId={application.id} fieldName="gd_status" value={application.gd_status} gdApplicable={application.gd_applicable} /></div>
        <div><p className="text-xs font-semibold uppercase text-portal-muted">Offer</p><div className="mt-2"><StatusBadge status={application.offer_status} /></div><RecruiterStageForm applicationId={application.id} fieldName="offer_status" value={application.offer_status} /></div>
      </div>
    </article>
  );
}

export default async function RecruiterApplicationsPage({ searchParams }: { searchParams: Promise<{ q?: string; roleId?: string; status?: string }> }) {
  const profile = await requireRole("recruiter");
  const recruiter = await getRecruiterByProfileId(profile.id);
  const params = await searchParams;

  if (!recruiter) {
    return (
      <PortalShell navigation={recruiterNavigation} profile={profile} subtitle="Review applicants for company roles." title="Applications">
        <EmptyState title="Company profile not found" description="Ask the internship organizer to link this login to a company." />
      </PortalShell>
    );
  }

  const [roles, allApplications] = await Promise.all([
    getAssignedRolesForRecruiter(recruiter.id),
    getApplicationsForRecruiter(recruiter.id)
  ]);
  const selectedRole = roles.find((role) => role.id === params.roleId) ?? null;

  if (!selectedRole) {
    return (
      <PortalShell navigation={recruiterNavigation} profile={profile} subtitle="Choose a role to review its applicants." title="Applications">
        {roles.length === 0 ? (
          <EmptyState title="No company roles yet" description="Create roles in the Company Roles tab. Applicants will appear here after students register." />
        ) : <RoleCards applications={allApplications} roles={roles} />}
      </PortalShell>
    );
  }

  const q = (params.q ?? "").trim().toLowerCase();
  const status = params.status ?? "";
  const applications = allApplications.filter((application) => {
    const matchesRole = application.role_id === selectedRole.id;
    const matchesSearch = !q || [
      application.student_email,
      application.student_roll_number,
      application.student_name ?? ""
    ].some((value) => value.toLowerCase().includes(q));
    const matchesStatus = !status || [
      application.resume_shortlist_status,
      application.test_status,
      application.gd_status,
      application.offer_status
    ].includes(status as ApplicationStatus);

    return matchesRole && matchesSearch && matchesStatus;
  });

  return (
    <PortalShell navigation={recruiterNavigation} profile={profile} subtitle={`${selectedRole.title} applicants for ${selectedRole.company_name}.`} title="Applications">
      <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <Link className="text-sm font-semibold text-portal-blue" href="/recruiter/applications">Back to roles</Link>
        <form className="grid gap-3 rounded-portal border border-portal-line bg-white p-4 shadow-sm md:grid-cols-[1fr_180px_auto]" action="/recruiter/applications">
          <input name="roleId" type="hidden" value={selectedRole.id} />
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="q" placeholder="Search student" defaultValue={params.q ?? ""} />
          <select className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="status" defaultValue={status}>
            <option value="">Any status</option>
            {statusOptions.map((option) => <option key={option} value={option}>{statusLabels[option]}</option>)}
          </select>
          <button className="h-10 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white" type="submit">Filter</button>
        </form>
      </div>

      {applications.length === 0 ? (
        <EmptyState title="No applications found" description="Applicants for this role will appear here after students register." />
      ) : (
        <div className="space-y-4">
          {applications.map((application) => <ApplicationCard application={application} key={application.id} />)}
        </div>
      )}
    </PortalShell>
  );
}