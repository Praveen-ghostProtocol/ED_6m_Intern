"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Save } from "lucide-react";
import {
  createMasterResumeEntry,
  updateRejectedMasterResumeEntry,
  type StudentActionState
} from "@/app/student/actions";
import type { MasterResumeEntry } from "@/types/student";

type MasterResumeEntryFormProps = {
  entry?: MasterResumeEntry;
};

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-10 items-center justify-center gap-2 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <Save className="h-4 w-4" aria-hidden="true" />
      {pending ? "Saving" : label}
    </button>
  );
}

export function MasterResumeEntryForm({ entry }: MasterResumeEntryFormProps) {
  const action = entry ? updateRejectedMasterResumeEntry : createMasterResumeEntry;
  const [state, formAction] = useActionState<StudentActionState, FormData>(action, {});

  return (
    <form action={formAction} className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
      <input name="entryId" type="hidden" value={entry?.id ?? ""} />
      <div className="grid gap-4 lg:grid-cols-[0.8fr_1.4fr]">
        <label className="flex flex-col gap-2 text-sm font-medium text-portal-ink">
          Title
          <input
            className="h-10 rounded-portal border border-portal-line px-3 text-sm"
            defaultValue={entry?.title ?? ""}
            maxLength={160}
            name="title"
            required
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-portal-ink">
          Link <span className="font-normal text-portal-muted">optional</span>
          <input
            className="h-10 rounded-portal border border-portal-line px-3 text-sm"
            defaultValue={entry?.link ?? ""}
            name="link"
            placeholder="https://..."
            type="url"
          />
        </label>
      </div>
      <label className="mt-4 flex flex-col gap-2 text-sm font-medium text-portal-ink">
        Description
        <textarea
          className="min-h-32 rounded-portal border border-portal-line px-3 py-2 text-sm leading-6"
          defaultValue={entry?.description ?? ""}
          maxLength={2000}
          name="description"
          required
        />
      </label>
      <div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-portal-muted">
          {entry ? "Rejected entries can be corrected and sent back for review." : "Each entry is reviewed by your assigned verifier or the organizer."}
        </p>
        <SubmitButton label={entry ? "Resubmit" : "Submit entry"} />
      </div>
      {state.error ? (
        <p className="mt-4 rounded-portal border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{state.error}</p>
      ) : null}
      {state.success ? (
        <p className="mt-4 rounded-portal border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{state.success}</p>
      ) : null}
    </form>
  );
}