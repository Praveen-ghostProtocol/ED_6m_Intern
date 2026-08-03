"use client";

import { Fragment, useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { ExternalLink, Pencil, X } from "lucide-react";
import { updateRecruiterCompanyRole, type RecruiterActionState } from "@/app/recruiter/actions";
import type { RecruiterRole } from "@/types/recruiter";

const roleStatusStyle = {
  draft: "bg-slate-50 text-slate-700 border-slate-200",
  open: "bg-emerald-50 text-emerald-700 border-emerald-200",
  closed: "bg-red-50 text-red-700 border-red-200"
};

function formatDate(value: string | null) {
  return value ? new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(value)) : "No deadline";
}

function toDateInputValue(value: string | null) {
  if (!value) return "";
  return new Date(value).toISOString().slice(0, 10);
}

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-9 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving" : "Save role"}
    </button>
  );
}

function ActionMessage({ state }: { state: RecruiterActionState }) {
  if (state.error) {
    return <p className="mt-3 rounded-portal border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  }

  if (state.success) {
    return <p className="mt-3 rounded-portal border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>;
  }

  return null;
}

function RoleEditButton({ isEditing, onClick }: { isEditing: boolean; onClick: () => void }) {
  return (
    <button
      className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky"
      onClick={onClick}
      type="button"
    >
      {isEditing ? <X className="h-4 w-4" aria-hidden="true" /> : <Pencil className="h-4 w-4" aria-hidden="true" />}
      {isEditing ? "Close" : "Edit"}
    </button>
  );
}

function RoleEditPanel({ onCancel, role }: { onCancel: () => void; role: RecruiterRole }) {
  const [state, action] = useActionState(updateRecruiterCompanyRole, {});

  return (
    <form action={action} className="rounded-portal border border-portal-line bg-portal-canvas p-4" encType="multipart/form-data">
      <input name="roleId" type="hidden" value={role.id} />
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Role title
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" defaultValue={role.title} name="title" required />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Status
          <select className="h-10 rounded-portal border border-portal-line px-3 text-sm" defaultValue={role.status} name="status">
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Deadline
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" defaultValue={toDateInputValue(role.deadline)} name="deadline" type="date" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Duration
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" defaultValue={role.duration ?? ""} name="duration" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Stipend
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" defaultValue={role.stipend ?? ""} name="stipend" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Location
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" defaultValue={role.location ?? ""} name="location" />
        </label>
        <label className="flex items-center gap-2 pt-7 text-sm font-medium">
          <input className="h-4 w-4" defaultChecked={role.gd_applicable} name="gdApplicable" type="checkbox" />
          GD applicable
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Eligibility
          <textarea className="min-h-24 rounded-portal border border-portal-line px-3 py-2 text-sm" defaultValue={role.eligibility ?? ""} name="eligibility" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Selection process
          <textarea className="min-h-24 rounded-portal border border-portal-line px-3 py-2 text-sm" defaultValue={role.selection_process ?? ""} name="selectionProcess" />
        </label>
      </div>

      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Replace JD PDF
          <input className="rounded-portal border border-portal-line bg-white px-3 py-2 text-sm" accept="application/pdf" name="jdPdf" type="file" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Job description text
          <textarea className="min-h-28 rounded-portal border border-portal-line px-3 py-2 text-sm" defaultValue={role.job_description} name="jobDescription" />
        </label>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <SaveButton />
        <button className="h-9 rounded-portal border border-portal-line px-4 text-sm font-semibold text-portal-muted" onClick={onCancel} type="button">
          Cancel
        </button>
      </div>
      <ActionMessage state={state} />
    </form>
  );
}

export function CompanyRolesManager({ roles }: { roles: RecruiterRole[] }) {
  const [editingRoleId, setEditingRoleId] = useState<string | null>(null);

  return (
    <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1040px] text-left text-sm">
          <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
            <tr>
              <th className="px-4 py-3">Company</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Stipend</th>
              <th className="px-4 py-3">JD</th>
              <th className="px-4 py-3">Deadline</th>
              <th className="px-4 py-3">GD</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-portal-line">
            {roles.map((role) => {
              const isEditing = editingRoleId === role.id;

              return (
                <Fragment key={role.id}>
                  <tr>
                    <td className="px-4 py-4 font-semibold">{role.company_name}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.title}</td>
                    <td className="px-4 py-4">
                      <RoleEditButton isEditing={isEditing} onClick={() => setEditingRoleId((current) => current === role.id ? null : role.id)} />
                    </td>
                    <td className="px-4 py-4 text-portal-muted">{role.location ?? "-"}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.duration ?? "-"}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.stipend ?? "-"}</td>
                    <td className="px-4 py-4">
                      {role.jd_signed_url ? (
                        <a className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky" href={role.jd_signed_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-4 w-4" aria-hidden="true" />
                          View JD
                        </a>
                      ) : <span className="text-portal-muted">Text only</span>}
                    </td>
                    <td className="px-4 py-4 text-portal-muted">{formatDate(role.deadline)}</td>
                    <td className="px-4 py-4 text-portal-muted">{role.gd_applicable ? "Yes" : "No"}</td>
                    <td className="px-4 py-4"><span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${roleStatusStyle[role.status]}`}>{role.status}</span></td>
                  </tr>
                  {isEditing ? (
                    <tr>
                      <td className="bg-white px-4 py-4" colSpan={10}>
                        <RoleEditPanel role={role} onCancel={() => setEditingRoleId(null)} />
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}