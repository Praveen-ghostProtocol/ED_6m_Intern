"use client";

import { useActionState, useMemo, useState } from "react";
import { useFormStatus } from "react-dom";
import { CheckCircle2, ExternalLink, FileText, MapPin, RefreshCw, Trash2, X } from "lucide-react";
import {
  applyToRole,
  removeApplication,
  updateApplicationResume,
  type StudentActionState
} from "@/app/student/actions";
import { isSiemensHealthineers } from "@/lib/companies";
import type { CompanyRole, VerifiedResumeChoice } from "@/types/student";

type CompanyRolesTableProps = {
  roles: CompanyRole[];
  verifiedResumes: VerifiedResumeChoice[];
  applicationsLocked?: boolean;
};

type ModalMode = "details" | "register";

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

function isDeadlinePassed(value: string | null) {
  return Boolean(value && new Date(value) < new Date());
}

function firstUrl(value: string | null) {
  return value?.match(/https?:\/\/\S+/)?.[0] ?? null;
}

function ActionMessage({ state }: { state: StudentActionState }) {
  if (state.error) {
    return <p className="mt-4 rounded-portal border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  }

  if (state.success) {
    return <p className="mt-4 rounded-portal border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>;
  }

  return null;
}

function SubmitButton({ disabled, icon, label, pendingLabel, tone = "teal" }: { disabled?: boolean; icon: React.ReactNode; label: string; pendingLabel: string; tone?: "teal" | "red" }) {
  const { pending } = useFormStatus();
  const toneClass = tone === "red"
    ? "border border-red-200 bg-white text-red-700 hover:bg-red-50"
    : "bg-portal-teal text-white hover:bg-teal-800";

  return (
    <button
      className={`flex h-10 items-center justify-center gap-2 rounded-portal px-4 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${toneClass}`}
      disabled={disabled || pending}
      type="submit"
    >
      {icon}
      {pending ? pendingLabel : label}
    </button>
  );
}

function RegistrationForm({ applicationsLocked, role, verifiedResumes }: { applicationsLocked?: boolean; role: CompanyRole; verifiedResumes: VerifiedResumeChoice[] }) {
  const action = role.has_applied ? updateApplicationResume : applyToRole;
  const [state, formAction] = useActionState<StudentActionState, FormData>(action, {});
  const deadlinePassed = isDeadlinePassed(role.deadline);
  const roleClosed = role.status !== "open";
  const disabled = applicationsLocked || roleClosed || deadlinePassed || verifiedResumes.length === 0;
  const requiresActiveBacklog = isSiemensHealthineers(role.company_name);

  return (
    <form action={formAction} className="rounded-portal border border-portal-line bg-portal-canvas p-4">
      <input name="roleId" type="hidden" value={role.id} />
      {role.application_id ? <input name="applicationId" type="hidden" value={role.application_id} /> : null}
      <label className="flex flex-col gap-2 text-sm font-medium text-portal-ink">
        Verified resume
        <select
          className="h-10 rounded-portal border border-portal-line bg-white px-3 text-sm outline-none transition focus:border-portal-teal focus:ring-2 focus:ring-portal-mint"
          defaultValue={role.application_resume_id ?? ""}
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

      {requiresActiveBacklog ? (
        <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-portal-ink">
          Active backlog
          <select
            className="h-10 rounded-portal border border-portal-line bg-white px-3 text-sm outline-none transition focus:border-portal-teal focus:ring-2 focus:ring-portal-mint"
            defaultValue={role.application_active_backlog === null ? "" : role.application_active_backlog ? "yes" : "no"}
            disabled={disabled}
            name="activeBacklog"
            required
          >
            <option value="">Select Yes or No</option>
            <option value="no">No</option>
            <option value="yes">Yes</option>
          </select>
        </label>
      ) : null}

      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-portal-muted">
          {roleClosed
            ? "This role is closed. The JD remains visible, but registration changes are no longer available."
            : applicationsLocked
            ? "Application access is closed for your account. You can still view company details and JDs."
            : deadlinePassed
            ? "The deadline has passed. This registration can no longer be changed."
            : verifiedResumes.length === 0
              ? "A verified resume is required before registration."
              : role.has_applied
                ? `Currently registered with ${role.application_resume_file_name ?? "a verified resume"}.`
                : "Only verified resumes are shown here."}
        </p>
        <SubmitButton
          disabled={disabled}
          icon={role.has_applied ? <RefreshCw className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
          label={role.has_applied ? "Update application" : "Register"}
          pendingLabel={role.has_applied ? "Updating" : "Registering"}
        />
      </div>

      <ActionMessage state={state} />
    </form>
  );
}

function RemoveRegistrationForm({ applicationsLocked, role }: { applicationsLocked?: boolean; role: CompanyRole }) {
  const [state, formAction] = useActionState<StudentActionState, FormData>(removeApplication, {});
  const deadlinePassed = isDeadlinePassed(role.deadline);
  const roleClosed = role.status !== "open";

  if (!role.application_id) {
    return null;
  }

  return (
    <form action={formAction} className="rounded-portal border border-red-100 bg-white p-4">
      <input name="applicationId" type="hidden" value={role.application_id} />
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-portal-muted">
          Remove this registration before the deadline. You can register again later while the role is still open.
        </p>
        <SubmitButton
          disabled={applicationsLocked || roleClosed || deadlinePassed}
          icon={<Trash2 className="h-4 w-4" aria-hidden="true" />}
          label="Remove"
          pendingLabel="Removing"
          tone="red"
        />
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

export function CompanyRolesTable({ applicationsLocked = false, roles, verifiedResumes }: CompanyRolesTableProps) {
  const [modal, setModal] = useState<{ mode: ModalMode; roleId: string } | null>(null);
  const selectedRole = useMemo(
    () => roles.find((role) => role.id === modal?.roleId) ?? null,
    [roles, modal]
  );

  return (
    <>
      <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1020px] border-collapse text-left text-sm">
            <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
              <tr>
                <th className="px-4 py-3 font-semibold">Company</th>
                <th className="px-4 py-3 font-semibold">Role</th>
                <th className="px-4 py-3 font-semibold">Location</th>
                <th className="px-4 py-3 font-semibold">Duration</th>
                <th className="px-4 py-3 font-semibold">Stipend (₹k/month)</th>
                <th className="px-4 py-3 font-semibold">Deadline</th>
                <th className="px-4 py-3 font-semibold">JD</th>
                <th className="px-4 py-3 font-semibold">Register</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-portal-line">
              {roles.map((role) => {
                const deadlinePassed = isDeadlinePassed(role.deadline);
                const roleClosed = role.status !== "open";
                const registrationDisabled = applicationsLocked || roleClosed || deadlinePassed;
                const externalFormUrl = firstUrl(role.selection_process);

                return (
                  <tr className="align-top" key={role.id}>
                    <td className="px-4 py-4 font-semibold text-portal-ink">{role.company_name}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.title}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.location ?? "Not specified"}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.duration ?? "Not specified"}</td>
                    <td className="px-4 py-4 font-semibold text-portal-muted">{role.stipend_band}</td>
                    <td className="px-4 py-4 text-portal-muted">{formatDate(role.deadline)}</td>
                    <td className="px-4 py-4">
                      {role.jd_signed_url ? (
                        <a
                          className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky"
                          href={role.jd_signed_url}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          View JD
                        </a>
                      ) : (
                        <button
                          className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky"
                          onClick={() => setModal({ mode: "details", roleId: role.id })}
                          type="button"
                        >
                          <FileText className="h-4 w-4" aria-hidden="true" />
                          Details
                        </button>
                      )}
                      {externalFormUrl ? (
                        <a
                          className="mt-2 inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky"
                          href={externalFormUrl}
                          rel="noreferrer"
                          target="_blank"
                        >
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          External Form
                        </a>
                      ) : null}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          className="inline-flex h-9 items-center gap-2 rounded-portal bg-portal-teal px-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={registrationDisabled}
                          onClick={() => setModal({ mode: "register", roleId: role.id })}
                          type="button"
                        >
                          {role.has_applied ? <RefreshCw className="h-4 w-4" aria-hidden="true" /> : <CheckCircle2 className="h-4 w-4" aria-hidden="true" />}
                          {role.has_applied ? "Update" : "Register"}
                        </button>
                        {role.has_applied ? (
                          <button
                            className="inline-flex h-9 items-center gap-2 rounded-portal border border-red-200 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
                            disabled={registrationDisabled}
                            onClick={() => setModal({ mode: "register", roleId: role.id })}
                            type="button"
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                            Remove
                          </button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {selectedRole && modal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/35 px-4 py-6">
          <section className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-portal border border-portal-line bg-white shadow-xl">
            <header className="flex items-start justify-between gap-4 border-b border-portal-line px-5 py-4">
              <div>
                <p className="text-sm font-semibold text-portal-teal">{selectedRole.company_name}</p>
                <h2 className="mt-1 text-xl font-semibold">{selectedRole.title}</h2>
              </div>
              <button
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-portal border border-portal-line text-portal-muted transition hover:bg-slate-50"
                onClick={() => setModal(null)}
                type="button"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </header>

            <div className="space-y-5 px-5 py-5">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-portal border border-portal-line p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Duration</p>
                  <p className="mt-1 text-sm">{selectedRole.duration ?? "Not specified"}</p>
                </div>
                <div className="rounded-portal border border-portal-line p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Location</p>
                  <p className="mt-1 flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-portal-teal" aria-hidden="true" />
                    {selectedRole.location ?? "Not specified"}
                  </p>
                </div>
                <div className="rounded-portal border border-portal-line p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Stipend (₹k/month)</p>
                  <p className="mt-1 text-sm font-semibold">{selectedRole.stipend_band}</p>
                </div>
                <div className="rounded-portal border border-portal-line p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-portal-muted">Deadline</p>
                  <p className="mt-1 text-sm">{formatDate(selectedRole.deadline)}</p>
                </div>
              </div>

              {modal.mode === "details" ? (
                <>
                  {firstUrl(selectedRole.selection_process) ? (
                    <a
                      className="inline-flex h-10 items-center gap-2 rounded-portal border border-portal-line px-4 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky"
                      href={firstUrl(selectedRole.selection_process) ?? undefined}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Fill External Form
                    </a>
                  ) : null}

                  {selectedRole.jd_signed_url ? (
                    <a
                      className="inline-flex h-10 items-center gap-2 rounded-portal border border-portal-line px-4 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky"
                      href={selectedRole.jd_signed_url}
                      rel="noreferrer"
                      target="_blank"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                      Open JD PDF
                    </a>
                  ) : null}

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
                </>
              ) : (
                <div className="space-y-4">
                  <RegistrationForm applicationsLocked={applicationsLocked} role={selectedRole} verifiedResumes={verifiedResumes} />
                  <RemoveRegistrationForm applicationsLocked={applicationsLocked} role={selectedRole} />
                </div>
              )}
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
