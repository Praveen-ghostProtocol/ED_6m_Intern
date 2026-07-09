"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Building2, BriefcaseBusiness } from "lucide-react";
import {
  createCompany,
  createInternshipRole,
  type OrganizerActionState
} from "@/app/organizer/actions";
import type { OrganizerCompany } from "@/types/organizer";

function SubmitButton({ label, pendingLabel }: { label: string; pendingLabel: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-10 items-center justify-center gap-2 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      {pending ? pendingLabel : label}
    </button>
  );
}

function ActionMessage({ state }: { state: OrganizerActionState }) {
  if (state.error) {
    return <p className="mt-3 rounded-portal border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>;
  }

  if (state.success) {
    return <p className="mt-3 rounded-portal border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>;
  }

  return null;
}

export function CompanyForm() {
  const [state, action] = useActionState(createCompany, {});

  return (
    <form action={action} className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center gap-2">
        <Building2 className="h-5 w-5 text-portal-teal" aria-hidden="true" />
        <h2 className="text-base font-semibold">Create Company</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Company name
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="name" required />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Description
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="description" />
        </label>
      </div>
      <div className="mt-4"><SubmitButton label="Create company" pendingLabel="Creating" /></div>
      <ActionMessage state={state} />
    </form>
  );
}

export function RoleForm({ companies }: { companies: OrganizerCompany[] }) {
  const [state, action] = useActionState(createInternshipRole, {});

  return (
    <form action={action} className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" encType="multipart/form-data">
      <div className="mb-4 flex items-center gap-2">
        <BriefcaseBusiness className="h-5 w-5 text-portal-blue" aria-hidden="true" />
        <h2 className="text-base font-semibold">Create Internship Role</h2>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Company
          <select className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="companyId" required>
            <option value="">Select company</option>
            {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Role title
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="title" required />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Status
          <select className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="status" defaultValue="draft">
            <option value="draft">Draft</option>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Duration
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="duration" placeholder="6 months" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Stipend
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="stipend" placeholder="25000/month" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Location
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="location" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Deadline
          <input className="h-10 rounded-portal border border-portal-line px-3 text-sm" name="deadline" type="date" />
        </label>
        <label className="flex items-center gap-2 pt-7 text-sm font-medium">
          <input className="h-4 w-4" name="gdApplicable" type="checkbox" />
          GD applicable
        </label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          Eligibility
          <textarea className="min-h-24 rounded-portal border border-portal-line px-3 py-2 text-sm" name="eligibility" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Selection process
          <textarea className="min-h-24 rounded-portal border border-portal-line px-3 py-2 text-sm" name="selectionProcess" />
        </label>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium">
          JD PDF
          <input className="rounded-portal border border-portal-line px-3 py-2 text-sm" accept="application/pdf" name="jdPdf" type="file" />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium">
          Job description text
          <textarea className="min-h-28 rounded-portal border border-portal-line px-3 py-2 text-sm" name="jobDescription" placeholder="Optional if a JD PDF is uploaded" />
        </label>
      </div>
      <div className="mt-4"><SubmitButton label="Create role" pendingLabel="Creating" /></div>
      <ActionMessage state={state} />
    </form>
  );
}