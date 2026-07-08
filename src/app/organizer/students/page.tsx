import { Search } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { requireRole } from "@/lib/auth/guards";
import { organizerNavigation } from "@/lib/rbac";
import { getStudentsForOrganizer } from "@/lib/organizer/queries";

export const dynamic = "force-dynamic";

export default async function OrganizerStudentsPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const profile = await requireRole("organizer");
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const students = (await getStudentsForOrganizer()).filter((student) => {
    if (!q) return true;
    return [student.roll_number, student.email, student.full_name ?? ""].some((value) => value.toLowerCase().includes(q));
  });

  return (
    <PortalShell navigation={organizerNavigation} profile={profile} subtitle="View eligible students, account state, resumes, and applications." title="Students">
      <form className="mb-5 flex max-w-lg gap-2" action="/organizer/students">
        <input className="h-10 flex-1 rounded-portal border border-portal-line px-3 text-sm" name="q" placeholder="Search roll number, email, or name" defaultValue={params.q ?? ""} />
        <button className="flex h-10 items-center gap-2 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white" type="submit"><Search className="h-4 w-4" />Search</button>
      </form>
      {students.length === 0 ? <EmptyState title="No students found" description="Student records will appear here after accounts are imported." /> : (
        <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left text-sm"><thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700"><tr><th className="px-4 py-3">Roll</th><th className="px-4 py-3">Student</th><th className="px-4 py-3">CGPA</th><th className="px-4 py-3">Branch</th><th className="px-4 py-3">Account</th><th className="px-4 py-3">Resumes</th><th className="px-4 py-3">Applications</th></tr></thead><tbody className="divide-y divide-portal-line">{students.map((student) => <tr key={student.id}><td className="px-4 py-4 font-semibold">{student.roll_number}</td><td className="px-4 py-4"><div className="font-semibold">{student.full_name ?? student.email}</div><div className="text-xs text-portal-muted">{student.email}</div></td><td className="px-4 py-4 text-portal-muted">{student.cgpa ?? "-"}</td><td className="px-4 py-4 text-portal-muted">{student.branch}</td><td className="px-4 py-4 text-portal-muted">{student.is_active ? "Active" : "Inactive"}{student.must_change_password ? " / password pending" : ""}</td><td className="px-4 py-4 text-portal-muted">{student.resume_count}</td><td className="px-4 py-4 text-portal-muted">{student.application_count}</td></tr>)}</tbody></table></div></div>
      )}
    </PortalShell>
  );
}