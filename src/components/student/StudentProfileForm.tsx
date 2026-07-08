"use client";

import { useActionState, useState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import { updateStudentProfile, type StudentActionState } from "@/app/student/actions";
import type { Profile } from "@/types/auth";
import {
  branchSpecialisations,
  genderOptions,
  type BranchSpecialisation,
  type StudentRecord
} from "@/types/student";

const idddPrefix = "IDDD - ";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-10 items-center justify-center gap-2 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <Save className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving" : "Save profile"}
    </button>
  );
}

function Field({
  children,
  label
}: {
  children: React.ReactNode;
  label: string;
}) {
  return (
    <label className="flex flex-col gap-2 text-sm font-medium text-portal-ink">
      {label}
      {children}
    </label>
  );
}

function getInitialBranchSpecialisation(value: string | null) {
  if (!value) {
    return { idddDetail: "", selected: "" };
  }

  if (value.startsWith(idddPrefix)) {
    return { idddDetail: value.slice(idddPrefix.length), selected: "IDDD" };
  }

  if (branchSpecialisations.includes(value as BranchSpecialisation)) {
    return { idddDetail: "", selected: value };
  }

  return { idddDetail: "", selected: "" };
}

const inputClass =
  "h-10 rounded-portal border border-portal-line bg-white px-3 text-sm outline-none transition focus:border-portal-blue focus:ring-2 focus:ring-portal-sky disabled:bg-slate-50 disabled:text-portal-muted";
const textareaClass =
  "min-h-28 rounded-portal border border-portal-line bg-white px-3 py-2 text-sm outline-none transition focus:border-portal-blue focus:ring-2 focus:ring-portal-sky";

export function StudentProfileForm({ profile, student }: { profile: Profile; student: StudentRecord }) {
  const [state, formAction] = useActionState<StudentActionState, FormData>(updateStudentProfile, {});
  const initialBranchSpecialisation = getInitialBranchSpecialisation(student.branch_specialisation);
  const [selectedBranchSpecialisation, setSelectedBranchSpecialisation] = useState(initialBranchSpecialisation.selected);

  return (
    <form action={formAction} className="space-y-5">
      <section className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Identity</h2>
          <p className="mt-1 text-sm text-portal-muted">Email and roll number are fixed by the internship team.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Full name">
            <input className={inputClass} name="fullName" defaultValue={profile.full_name ?? ""} required />
          </Field>
          <Field label="Roll number">
            <input className={inputClass} value={student.roll_number} readOnly disabled />
          </Field>
          <Field label="Institute email">
            <input className={inputClass} value={profile.email} readOnly disabled />
          </Field>
          <Field label="Branch">
            <input className={inputClass} value={student.branch} readOnly disabled />
          </Field>
        </div>
      </section>

      <section className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Academic Details</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Branch specialisation">
            <select
              className={inputClass}
              name="branchSpecialisation"
              onChange={(event) => setSelectedBranchSpecialisation(event.target.value)}
              required
              value={selectedBranchSpecialisation}
            >
              <option value="">Select specialisation</option>
              {branchSpecialisations.map((specialisation) => (
                <option key={specialisation} value={specialisation}>{specialisation}</option>
              ))}
            </select>
          </Field>
          <Field label="CGPA">
            <input
              className={inputClass}
              defaultValue={student.cgpa ?? ""}
              inputMode="decimal"
              max="10"
              min="0"
              name="cgpa"
              required
              step="0.01"
              type="number"
            />
          </Field>
          {selectedBranchSpecialisation === "IDDD" ? (
            <Field label="IDDD specialisation">
              <input
                className={inputClass}
                defaultValue={initialBranchSpecialisation.idddDetail}
                name="idddSpecialisation"
                placeholder="Enter your IDDD programme"
                required
              />
            </Field>
          ) : null}
        </div>
      </section>

      <section className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Personal Details</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Contact number">
            <input className={inputClass} name="phone" defaultValue={student.phone ?? ""} required />
          </Field>
          <Field label="Alternate number">
            <input className={inputClass} name="alternatePhone" defaultValue={student.alternate_phone ?? ""} />
          </Field>
          <Field label="Alternate email address">
            <input className={inputClass} name="alternateEmail" defaultValue={student.alternate_email ?? ""} type="email" />
          </Field>
          <Field label="Date of birth">
            <input className={inputClass} name="dateOfBirth" defaultValue={student.date_of_birth ?? ""} required type="date" />
          </Field>
          <Field label="Gender">
            <select className={inputClass} name="gender" defaultValue={student.gender ?? ""} required>
              <option value="">Select gender</option>
              {genderOptions.map((gender) => (
                <option key={gender} value={gender}>{gender}</option>
              ))}
            </select>
          </Field>
        </div>
      </section>

      <section className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
        <div className="mb-5">
          <h2 className="text-base font-semibold">Address Details</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="Current address pincode">
            <input className={inputClass} name="currentAddressPincode" defaultValue={student.current_address_pincode ?? ""} required />
          </Field>
          <Field label="Permanent address pincode">
            <input className={inputClass} name="permanentAddressPincode" defaultValue={student.permanent_address_pincode ?? ""} required />
          </Field>
          <Field label="Current address">
            <textarea className={textareaClass} name="currentAddress" defaultValue={student.current_address ?? ""} required />
          </Field>
          <Field label="Permanent address">
            <textarea className={textareaClass} name="permanentAddress" defaultValue={student.permanent_address ?? ""} required />
          </Field>
        </div>
      </section>

      {state.error ? (
        <p className="rounded-portal border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="rounded-portal border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>
      ) : null}

      <div className="flex justify-end">
        <SubmitButton />
      </div>
    </form>
  );
}