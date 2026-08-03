import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { requireRole } from "@/lib/auth/guards";
import { verifierNavigation } from "@/lib/rbac";
import { getAssignedStudentsForVerifier } from "@/lib/verifier/queries";

export const dynamic = "force-dynamic";

export default async function VerifierStudentsPage() {
  const profile = await requireRole("verifier");
  const students = await getAssignedStudentsForVerifier(profile.id);

  return (
    <PortalShell navigation={verifierNavigation} profile={profile} subtitle="Students assigned by the organizer for your verification queue." title="Assigned Students">
      {students.length === 0 ? <EmptyState title="No assigned students" description="Organizer assignments will appear here." /> : (
        <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700"><tr><th className="px-4 py-3">Student</th><th className="px-4 py-3">Roll Number</th><th className="px-4 py-3">CGPA</th><th className="px-4 py-3">Specialisation</th><th className="px-4 py-3">Master Entries</th><th className="px-4 py-3">PDF Resumes</th></tr></thead>
              <tbody className="divide-y divide-portal-line">
                {students.map((student) => <tr key={student.id}><td className="px-4 py-4"><div className="font-semibold">{student.full_name ?? student.email}</div><div className="text-xs text-portal-muted">{student.email}</div></td><td className="px-4 py-4 text-portal-muted">{student.roll_number}</td><td className="px-4 py-4 text-portal-muted">{student.cgpa ?? "-"}</td><td className="px-4 py-4 text-portal-muted">{student.branch_specialisation ?? "-"}</td><td className="px-4 py-4 text-portal-muted">{student.master_entry_count}</td><td className="px-4 py-4 text-portal-muted">{student.resume_count}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </PortalShell>
  );
}