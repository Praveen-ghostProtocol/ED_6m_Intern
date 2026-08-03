"use client";

import { useState, useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Building2, Pencil, X } from "lucide-react";
import { updateRecruiterCompanyDetails, type RecruiterActionState } from "@/app/recruiter/actions";
import type { RecruiterProfile } from "@/types/recruiter";

function SaveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="h-9 rounded-portal bg-portal-blue px-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? "Saving" : "Save"}
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

export function CompanyDetailsEditor({ recruiter }: { recruiter: RecruiterProfile }) {
  const [isEditing, setIsEditing] = useState(false);
  const [state, action] = useActionState(updateRecruiterCompanyDetails, {});

  return (
    <section className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-portal-blue" aria-hidden="true" />
          <h2 className="text-base font-semibold">Company Details</h2>
        </div>
        <button
          className="inline-flex h-9 items-center gap-2 rounded-portal border border-portal-line px-3 text-sm font-semibold text-portal-blue transition hover:bg-portal-sky"
          onClick={() => setIsEditing((value) => !value)}
          type="button"
        >
          {isEditing ? <X className="h-4 w-4" aria-hidden="true" /> : <Pencil className="h-4 w-4" aria-hidden="true" />}
          {isEditing ? "Cancel" : "Edit"}
        </button>
      </div>

      {!isEditing ? (
        <div className="overflow-hidden rounded-portal border border-portal-line">
          <table className="w-full text-left text-sm">
            <thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700">
              <tr>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-4 font-semibold">{recruiter.company_name}</td>
                <td className="px-4 py-4 text-portal-muted">{recruiter.company_description ?? "-"}</td>
                <td className="px-4 py-4">
                  <button className="text-sm font-semibold text-portal-blue" onClick={() => setIsEditing(true)} type="button">
                    Edit
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      ) : (
        <form action={action} className="grid gap-4 md:grid-cols-[minmax(220px,320px)_1fr_auto] md:items-end">
          <label className="flex flex-col gap-2 text-sm font-medium">
            Company name
            <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" defaultValue={recruiter.company_name} name="name" required />
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium">
            Description
            <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" defaultValue={recruiter.company_description ?? ""} name="description" />
          </label>
          <SaveButton />
        </form>
      )}
      <ActionMessage state={state} />
    </section>
  );
}