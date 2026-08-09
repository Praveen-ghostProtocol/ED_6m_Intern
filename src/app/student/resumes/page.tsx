import { ExternalLink } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { ResumeRowActions } from "@/components/student/ResumeRowActions";
import { ResumeUploadForm } from "@/components/student/ResumeUploadForm";
import { StatusBadge } from "@/components/student/StatusBadge";
import { studentNavigation } from "@/lib/rbac";
import { requireStudent } from "@/lib/student/guards";
import { getStudentResumes } from "@/lib/student/queries";

export const dynamic = "force-dynamic";

function formatBytes(bytes: number) {
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

export default async function StudentResumesPage() {
  const { profile, student } = await requireStudent();

  return (
    <PortalShell
      navigation={studentNavigation}
      profile={profile}
      subtitle="Upload up to three PDF resumes and track verification status."
      title="My Resumes"
    >
      <ResumeList studentId={student.id} />
    </PortalShell>
  );
}

async function ResumeList({ studentId }: { studentId: string }) {
  const resumes = await getStudentResumes(studentId);

  return (
    <div className="space-y-5">
      <ResumeUploadForm resumeCount={resumes.length} />

      {resumes.length === 0 ? (
        <EmptyState
          description="Uploaded resumes will appear here with their verification status. Only verified resumes can be used for company registration."
          title="No resumes uploaded yet"
        />
      ) : (
        <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] border-collapse text-left text-sm">
              <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
                <tr>
                  <th className="px-4 py-3 font-semibold">Resume</th>
                  <th className="px-4 py-3 font-semibold">Uploaded</th>
                  <th className="px-4 py-3 font-semibold">Size</th>
                  <th className="px-4 py-3 font-semibold">Verification</th>
                  <th className="px-4 py-3 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-portal-line">
                {resumes.map((resume) => (
                  <tr key={resume.id}>
                    <td className="px-4 py-4 font-semibold text-portal-ink">
                      <div>{resume.file_name}</div>
                      {resume.verification_note ? (
                        <p className="mt-1 text-xs font-normal text-portal-muted">{resume.verification_note}</p>
                      ) : null}
                    </td>
                    <td className="px-4 py-4 text-portal-muted">{formatDate(resume.uploaded_at)}</td>
                    <td className="px-4 py-4 text-portal-muted">{formatBytes(resume.file_size_bytes)}</td>
                    <td className="px-4 py-4"><StatusBadge status={resume.status} /></td>
                    <td className="min-w-[360px] px-4 py-4">
                      <div className="space-y-3">
                        {resume.signed_url ? (
                          <a
                            className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky"
                            href={resume.signed_url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            <ExternalLink className="h-4 w-4" aria-hidden="true" />
                            View
                          </a>
                        ) : (
                          <span className="text-sm text-portal-muted">Unavailable</span>
                        )}
                        <ResumeRowActions resumeId={resume.id} status={resume.status} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}