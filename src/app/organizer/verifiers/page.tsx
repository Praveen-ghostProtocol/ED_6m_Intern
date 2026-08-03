import { assignVerifierToStudent } from "@/app/organizer/actions";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { StatusBadge } from "@/components/student/StatusBadge";
import { requireRole } from "@/lib/auth/guards";
import { organizerNavigation } from "@/lib/rbac";
import { getStudentsForOrganizer, getVerifierAssignmentsForOrganizer, getVerifiersForOrganizer, getVerificationItemsForOrganizer } from "@/lib/organizer/queries";
import type { OrganizerVerificationItem } from "@/types/organizer";
import type { ResumeStatus } from "@/types/student";

export const dynamic = "force-dynamic";

const statusOptions: Array<"all" | ResumeStatus> = ["all", "pending", "verified", "rejected"];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value));
}

function itemKindLabel(kind: OrganizerVerificationItem["kind"]) {
  return kind === "resume" ? "PDF Resume" : "Master Resume";
}

function filterItems(items: OrganizerVerificationItem[], q: string, status: "all" | ResumeStatus) {
  const normalized = q.trim().toLowerCase();

  return items.filter((item) => {
    if (status !== "all" && item.status !== status) return false;
    if (!normalized) return true;
    return [item.student_roll_number, item.student_email, item.student_name ?? "", item.title].some((value) => value.toLowerCase().includes(normalized));
  });
}

function VerifierSelectForm({ item, verifiers }: { item: OrganizerVerificationItem; verifiers: Awaited<ReturnType<typeof getVerifiersForOrganizer>> }) {
  return (
    <form action={assignVerifierToStudent} className="flex min-w-[260px] gap-2">
      <input name="studentId" type="hidden" value={item.student_id} />
      <select className="h-9 flex-1 rounded-portal border border-portal-line px-2 text-sm" defaultValue={item.assigned_verifier_profile_id ?? ""} name="verifierProfileId" required>
        <option value="">Select verifier</option>
        {verifiers.map((verifier) => <option key={verifier.profile_id} value={verifier.profile_id}>{verifier.full_name ?? verifier.email}</option>)}
      </select>
      <button className="h-9 rounded-portal bg-portal-blue px-3 text-sm font-semibold text-white" type="submit">Assign</button>
    </form>
  );
}

export default async function OrganizerVerifiersPage({ searchParams }: { searchParams: Promise<{ q?: string; status?: string }> }) {
  const profile = await requireRole("organizer");
  const params = await searchParams;
  const selectedStatus = statusOptions.includes(params.status as "all" | ResumeStatus) ? params.status as "all" | ResumeStatus : "all";
  const q = params.q ?? "";
  const [verifiers, students, assignments, verificationItems] = await Promise.all([
    getVerifiersForOrganizer(),
    getStudentsForOrganizer(),
    getVerifierAssignmentsForOrganizer(),
    getVerificationItemsForOrganizer()
  ]);
  const filteredItems = filterItems(verificationItems, q, selectedStatus);

  return (
    <PortalShell navigation={organizerNavigation} profile={profile} subtitle="Assign verifiers and monitor pending, verified, and rejected resume material." title="Verifiers">
      <section className="mb-5 rounded-portal border border-portal-line bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold">Assign Student to Verifier</h2>
        <form action={assignVerifierToStudent} className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]">
          <select className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="studentId" required>
            <option value="">Select student</option>
            {students.map((student) => <option key={student.id} value={student.id}>{student.roll_number} - {student.full_name ?? student.email}</option>)}
          </select>
          <select className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="verifierProfileId" required>
            <option value="">Select verifier</option>
            {verifiers.map((verifier) => <option key={verifier.profile_id} value={verifier.profile_id}>{verifier.full_name ?? verifier.email} ({verifier.assigned_student_count})</option>)}
          </select>
          <button className="h-10 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white" type="submit">Assign</button>
        </form>
        <p className="mt-3 text-sm text-portal-muted">You can also assign from the resume material table below. Assignment is student-level, so all material for that student goes to the selected verifier.</p>
      </section>

      <section className="mb-5 rounded-portal border border-portal-line bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h2 className="text-base font-semibold">Resume Material Allocation</h2>
            <p className="mt-1 text-sm text-portal-muted">Pending items are sorted first, followed by verified and rejected items time-wise.</p>
          </div>
          <form className="grid gap-2 md:grid-cols-[180px_1fr_auto]" action="/organizer/verifiers">
            <select className="h-10 rounded-portal border border-portal-line px-3 text-sm" defaultValue={selectedStatus} name="status">
              {statusOptions.map((status) => <option key={status} value={status}>{status === "all" ? "All statuses" : status}</option>)}
            </select>
            <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" defaultValue={q} name="q" placeholder="Search roll number" />
            <button className="h-10 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white" type="submit">Filter</button>
          </form>
        </div>

        {filteredItems.length === 0 ? <div className="mt-5"><EmptyState title="No resume material found" description="Try changing the status filter or roll-number search." /></div> : (
          <div className="mt-5 overflow-hidden rounded-portal border border-portal-line">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[1160px] text-left text-sm">
                <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
                  <tr>
                    <th className="px-4 py-3">Student</th>
                    <th className="px-4 py-3">Material</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3">Current Verifier</th>
                    <th className="px-4 py-3">Assign Verifier</th>
                    <th className="px-4 py-3">Comments</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-portal-line">
                  {filteredItems.map((item) => (
                    <tr key={`${item.kind}:${item.id}`}>
                      <td className="px-4 py-4"><div className="font-semibold">{item.student_name ?? item.student_email}</div><div className="text-xs text-portal-muted">{item.student_roll_number} - {item.student_email}</div></td>
                      <td className="px-4 py-4"><div className="font-semibold">{item.title}</div><div className="text-xs text-portal-muted">{itemKindLabel(item.kind)}</div></td>
                      <td className="px-4 py-4"><StatusBadge status={item.status} /></td>
                      <td className="px-4 py-4 text-portal-muted">{formatDate(item.submitted_at)}</td>
                      <td className="px-4 py-4 text-portal-muted">{item.assigned_verifier_name ?? item.assigned_verifier_email ?? "Unassigned"}</td>
                      <td className="px-4 py-4"><VerifierSelectForm item={item} verifiers={verifiers} /></td>
                      <td className="px-4 py-4 text-portal-muted">{item.verification_note ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section className="mb-5 grid gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
          <div className="border-b border-portal-line px-5 py-4"><h2 className="font-semibold">Verifier Accounts</h2></div>
          {verifiers.length === 0 ? <div className="p-5"><EmptyState title="No verifiers yet" description="Verifier profiles will appear here after account setup." /></div> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[520px] text-left text-sm"><thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700"><tr><th className="px-4 py-3">Verifier</th><th className="px-4 py-3">Assigned Students</th></tr></thead><tbody className="divide-y divide-portal-line">{verifiers.map((verifier) => <tr key={verifier.profile_id}><td className="px-4 py-4"><div className="font-semibold">{verifier.full_name ?? verifier.email}</div><div className="text-xs text-portal-muted">{verifier.email}</div></td><td className="px-4 py-4 text-portal-muted">{verifier.assigned_student_count}</td></tr>)}</tbody></table></div>
          )}
        </div>

        <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
          <div className="border-b border-portal-line px-5 py-4"><h2 className="font-semibold">Student Assignments</h2></div>
          {assignments.length === 0 ? <div className="p-5"><EmptyState title="No assignments yet" description="Assign students to verifiers using the form above." /></div> : (
            <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Verifier</th><th className="px-4 py-3">Assigned</th></tr></thead><tbody className="divide-y divide-portal-line">{assignments.map((assignment) => <tr key={assignment.id}><td className="px-4 py-4"><div className="font-semibold">{assignment.student_name ?? assignment.student_email}</div><div className="text-xs text-portal-muted">{assignment.student_roll_number}</div></td><td className="px-4 py-4"><div className="font-semibold">{assignment.verifier_name ?? assignment.verifier_email}</div><div className="text-xs text-portal-muted">{assignment.verifier_email}</div></td><td className="px-4 py-4 text-portal-muted">{formatDate(assignment.assigned_at)}</td></tr>)}</tbody></table></div>
          )}
        </div>
      </section>
    </PortalShell>
  );
}