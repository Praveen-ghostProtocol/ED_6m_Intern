import Link from "next/link";
import type { VerifierStudent } from "@/types/verifier";

export function VerifierCandidateTable({ students }: { students: VerifierStudent[] }) {
  return (
    <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
            <tr>
              <th className="px-4 py-3">Student</th>
              <th className="px-4 py-3">Roll Number</th>
              <th className="px-4 py-3">CGPA</th>
              <th className="px-4 py-3">Specialisation</th>
              <th className="px-4 py-3">Master Entries</th>
              <th className="px-4 py-3">PDF Resumes</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-portal-line">
            {students.map((student) => (
              <tr key={student.id}>
                <td className="px-4 py-4"><div className="font-semibold">{student.full_name ?? student.email}</div><div className="text-xs text-portal-muted">{student.email}</div></td>
                <td className="px-4 py-4 text-portal-muted">{student.roll_number}</td>
                <td className="px-4 py-4 text-portal-muted">{student.cgpa ?? "-"}</td>
                <td className="px-4 py-4 text-portal-muted">{student.branch_specialisation ?? "-"}</td>
                <td className="px-4 py-4 text-portal-muted">{student.master_entry_count}</td>
                <td className="px-4 py-4 text-portal-muted">{student.resume_count}</td>
                <td className="px-4 py-4"><Link className="text-sm font-semibold text-portal-blue" href={`/verifier/students/${student.id}`}>View materials</Link></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}