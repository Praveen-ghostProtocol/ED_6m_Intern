import { assignVerifierToStudent } from "@/app/organizer/actions";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { requireRole } from "@/lib/auth/guards";
import { organizerNavigation } from "@/lib/rbac";
import { getStudentsForOrganizer, getVerifierAssignmentsForOrganizer, getVerifiersForOrganizer } from "@/lib/organizer/queries";

export const dynamic = "force-dynamic";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value));
}

export default async function OrganizerVerifiersPage() {
  const profile = await requireRole("organizer");
  const [verifiers, students, assignments] = await Promise.all([
    getVerifiersForOrganizer(),
    getStudentsForOrganizer(),
    getVerifierAssignmentsForOrganizer()
  ]);

  return (
    <PortalShell navigation={organizerNavigation} profile={profile} subtitle="Assign one verifier to each student for resume material review." title="Verifiers">
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
        <p className="mt-3 text-sm text-portal-muted">Verifier account creation is handled through provisioning or Supabase Auth. This page assigns existing active verifier accounts.</p>
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