"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, FileText, MapPin, X } from "lucide-react";
import { applyToRole, type StudentActionState } from "@/app/student/actions";
import type { CompanyRole, VerifiedResumeChoice } from "@/types/student";

type CompanyRolesTableProps = {
  roles: CompanyRole[];
  verifiedResumes: VerifiedResumeChoice[];
};

function formatDate(value: string | null) {
  if (!value) {
    return "No deadline";
  }

  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).format(new Date(value));
}

function ApplyButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-10 items-center justify-center gap-2 rounded-portal bg-portal-teal px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || pending}
      type="submit"
    >
      <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
      {pending ? "Registering" : "Register"}
    </button>
  );
}

function ApplyForm({ role, verifiedResumes }: { role: CompanyRole; verifiedResumes: VerifiedResumeChoice[] }) {
  const [state, formAction] = useActionState<StudentActionState, FormData>(applyToRole, {});
  const disabled = role.has_applied || verifiedResumes.length === 0;

  return (
    <form action={formAction} className="mt-5 rounded-portal border border-portal-line bg-portal-canvas p-4">
      <input name="roleId" type="hidden" value={role.id} />
      <label className="flex flex-col gap-2 text-sm font-medium text-portal-ink">
        Verified resume
        <select
          className="h-10 rounded-portal border border-portal-line bg-white px-3 text-sm outline-none transition focus:border-portal-teal focus:ring-2 focus:ring-portal-mint"
          disabled={disabled}
          name="resumeId"
          required
        >
          <option value="">Select resume</option>
          {verifiedResumes.map((resume) => (
            <option key={resume.id} value={resume.id}>
              {resume.file_name}
            </option>
          ))}
        </select>
      </label>

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-portal-muted">
          {role.has_applied
            ? "You have already applied for this role."
            : verifiedResumes.length === 0
              ? "A verified resume is required before registration."
              : "Only verified resumes are shown here."}
        </p>
        <ApplyButton disabled={disabled} />
      </div>

      {state.error ? (
        <p className="mt-4 rounded-portal border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      {state.success ? (
        <p className="mt-4 rounded-portal border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {state.success}
        </p>
      ) : null}
    </form>
  );
}

export function CompanyRolesTable({ roles, verifiedResumes }: CompanyRolesTableProps) {
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId]
  );

  return (
    <>
      <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] border-collapse text-left text-sm">
            <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Duration</th>
                <th className="px-4 py-3 font-semibold">Stipend</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
                <th className="px-4 py-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-line">
              {roles.map((role) => (
                <tr className="align-top" key={role.id}>
                  <td className="px-4 py-4 font-semibold text-portal-ink">{role.company_name}</td>
                  <td className="px-4 py-4 text-portal-muted">{role.title}</td>
                  <td className="px-4 py-4 text-portal-muted">{role.location ?? "Not specified"}</td>
                  <td className="px-4 py-4 text-portal-muted">{role.duration ?? "Not specified"}</td>
                  <td className="px-4 py-4 text-portal-muted">{role.stipend ?? "Not specified"}</td>
                  <td className="px-4 py-4 text-portal-muted">{formatDate(role.deadline)}</td>
                  <td className="px-4 py-4">
                    <button
                      className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky"
                      onClick={() => setSelectedRoleId(role.id)}
                      type="button"
                    >
                      <FileText className="h-4 w-4" aria-hidden="true" />
                      View JD
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRole ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 py-6">
          <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-portal border border-portal-line bg-white shadow-xl">
            <header className="flex items-start justify-between gap-4 border-b border-portal-line px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-portal-teal">{selectedRole.company_name}</p>
                <h2 className="mt-1 text-xl font-semibold">{selectedRole.title}</h2>
              </div>
              <button
                aria-label="Close job description"
                className="flex h-9 w-9 items-center justify-center rounded-portal border border-portal-line text-portal-muted transition hover:bg-slate-50"
                onClick={() => setSelectedRoleId(null)}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-portal border border-portal-line p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Duration</p>
                  <p className="mt-1 text-sm">{selectedRole.duration ?? "Not specified"}</p>
                </div>
                <div className="rounded-portal border border-portal-line p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Stipend</p>
                  <p className="mt-1 text-sm">{selectedRole.stipend ?? "Not specified"}</p>
                </div>
                <div className="rounded-portal border border-portal-line p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Location</p>
                  <p className="mt-1 flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-portal-teal" aria-hidden="true" />
                    {selectedRole.location ?? "Not specified"}
                  </p>
                </div>
                <div className="rounded-portal border border-portal-line p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Deadline</p>
                  <p className="mt-1 text-sm">{formatDate(selectedRole.deadline)}</p>
                </div>
              </div>

              <section>
                <h3 className="text-sm font-semibold">Eligibility</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-portal-muted">
                  {selectedRole.eligibility ?? "No eligibility criteria listed."}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-semibold">Job Description</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-portal-muted">
                  {selectedRole.job_description}
                </p>
              </section>

              <section>
                <h3 className="text-sm font-semibold">Selection Process</h3>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-portal-muted">
                  {selectedRole.selection_process ?? "Selection process will be updated by the organizer."}
                </p>
              </section>

              <ApplyForm role={selectedRole} verifiedResumes={verifiedResumes} />
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}