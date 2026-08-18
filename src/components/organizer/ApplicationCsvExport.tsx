"use client";

import { useMemo, useState } from "react";
import { Download } from "lucide-react";
import type { OrganizerApplication, OrganizerRole } from "@/types/organizer";

function csvValue(value: string | number | boolean | null | undefined) {
  if (value === null || value === undefined) return "";
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function statusText(value: string) {
  return value.replace(/_/g, " ");
}

function absoluteShareUrl(path: string | null) {
  if (!path) return "";
  return new URL(path, window.location.origin).toString();
}

function resumeViewUrl(application: OrganizerApplication) {
  return application.resume_signed_url ?? application.resume_share_path;
}

export function ApplicationCsvExport({ applications, role }: { applications: OrganizerApplication[]; role: OrganizerRole }) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set(applications.map((application) => application.id)));

  const selectedApplications = useMemo(
    () => applications.filter((application) => selectedIds.has(application.id)),
    [applications, selectedIds]
  );

  function toggle(applicationId: string) {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(applicationId)) next.delete(applicationId);
      else next.add(applicationId);
      return next;
    });
  }

  function setAll(checked: boolean) {
    setSelectedIds(checked ? new Set(applications.map((application) => application.id)) : new Set());
  }

  function exportCsv() {
    const headers = [
      "Company",
      "Role",
      "Student Name",
      "Roll Number",
      "Email",
      "CGPA",
      "Specialisation",
      "Resume",
      "Resume Link",
      "Applied At",
      "Resume Shortlist",
      "Test Attended",
      "Test Shortlist",
      "GD Shortlist",
      "Offer Status"
    ];

    const rows = selectedApplications.map((application) => [
      application.company_name,
      application.role_title,
      application.student_name ?? "",
      application.student_roll_number,
      application.student_email,
      application.student_cgpa ?? "",
      application.student_branch_specialisation ?? "",
      application.resume_file_name,
      absoluteShareUrl(application.resume_share_path),
      new Date(application.applied_at).toLocaleString("en-IN"),
      statusText(application.resume_shortlist_status),
      application.test_attended === null ? "" : application.test_attended ? "Yes" : "No",
      statusText(application.test_status),
      statusText(application.gd_status),
      statusText(application.offer_status)
    ]);

    const csv = [headers, ...rows].map((row) => row.map(csvValue).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const safeCompany = role.company_name.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    const safeRole = role.title.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
    link.href = url;
    link.download = `${safeCompany}-${safeRole}-applications.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-portal border border-portal-line bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-base font-semibold">Export Applicants</h2>
          <p className="mt-1 text-sm text-portal-muted">Select applicants for this company role and export their full application details.</p>
        </div>
        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-portal border border-portal-line px-4 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky disabled:cursor-not-allowed disabled:opacity-60"
          disabled={selectedApplications.length === 0}
          onClick={exportCsv}
          type="button"
        >
          <Download className="h-4 w-4" aria-hidden="true" />
          Export selected CSV ({selectedApplications.length})
        </button>
      </div>
      <div className="mt-4 overflow-hidden rounded-portal border border-portal-line">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
            <tr>
              <th className="px-4 py-3"><input aria-label="Select all applicants" checked={selectedIds.size === applications.length && applications.length > 0} onChange={(event) => setAll(event.target.checked)} type="checkbox" /></th>
              <th className="px-4 py-3">Applicant</th>
              <th className="px-4 py-3">Roll Number</th>
              <th className="px-4 py-3">Resume</th>
              <th className="px-4 py-3">Current Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-portal-line">
            {applications.map((application) => (
              <tr key={application.id}>
                <td className="px-4 py-3"><input aria-label={`Select ${application.student_name ?? application.student_email}`} checked={selectedIds.has(application.id)} onChange={() => toggle(application.id)} type="checkbox" /></td>
                <td className="px-4 py-3"><div className="font-semibold">{application.student_name ?? application.student_email}</div><div className="text-xs text-portal-muted">{application.student_email}</div></td>
                <td className="px-4 py-3 text-portal-muted">{application.student_roll_number}</td>
                <td className="px-4 py-3 text-portal-muted">
                  {resumeViewUrl(application) ? (
                    <a className="font-semibold text-portal-blue" href={resumeViewUrl(application) ?? undefined} target="_blank" rel="noreferrer">
                      {application.resume_file_name}
                    </a>
                  ) : (
                    application.resume_file_name
                  )}
                </td>
                <td className="px-4 py-3 text-portal-muted">Resume {statusText(application.resume_shortlist_status)}, Test {statusText(application.test_status)}, Offer {statusText(application.offer_status)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
