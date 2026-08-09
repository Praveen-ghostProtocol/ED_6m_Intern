"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { RefreshCw, Trash2 } from "lucide-react";
import { removeResume, updateResumeFile, type StudentActionState } from "@/app/student/actions";
import type { ResumeStatus } from "@/types/student";

type ResumeRowActionsProps = {
  resumeId: string;
  status: ResumeStatus;
};

function UpdateButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-9 items-center justify-center gap-2 rounded-portal bg-portal-blue px-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <RefreshCw className="h-4 w-4" aria-hidden="true" />
      {pending ? "Updating" : "Update"}
    </button>
  );
}

function RemoveButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="inline-flex h-9 items-center justify-center gap-2 rounded-portal border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={pending}
      type="submit"
    >
      <Trash2 className="h-4 w-4" aria-hidden="true" />
      {pending ? "Removing" : "Remove"}
    </button>
  );
}

export function ResumeRowActions({ resumeId, status }: ResumeRowActionsProps) {
  const [updateState, updateAction] = useActionState<StudentActionState, FormData>(updateResumeFile, {});
  const [removeState, removeAction] = useActionState<StudentActionState, FormData>(removeResume, {});
  const locked = status === "verified";

  if (locked) {
    return <p className="text-sm text-portal-muted">Verified resumes are locked.</p>;
  }

  return (
    <div className="space-y-3">
      <form action={updateAction} className="space-y-2">
        <input name="resumeId" type="hidden" value={resumeId} />
        <input
          accept="application/pdf"
          className="w-full rounded-portal border border-portal-line bg-white px-3 py-2 text-sm file:mr-3 file:rounded-portal file:border-0 file:bg-portal-sky file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-portal-blue"
          name="resume"
          required
          type="file"
        />
        <UpdateButton />
      </form>

      <form action={removeAction}>
        <input name="resumeId" type="hidden" value={resumeId} />
        <RemoveButton />
      </form>

      {updateState.error ? <p className="text-xs font-medium text-red-700">{updateState.error}</p> : null}
      {updateState.success ? <p className="text-xs font-medium text-emerald-700">{updateState.success}</p> : null}
      {removeState.error ? <p className="text-xs font-medium text-red-700">{removeState.error}</p> : null}
      {removeState.success ? <p className="text-xs font-medium text-emerald-700">{removeState.success}</p> : null}
    </div>
  );
}
