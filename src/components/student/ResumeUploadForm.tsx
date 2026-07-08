"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Upload } from "lucide-react";
import { uploadResume, type StudentActionState } from "@/app/student/actions";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-10 items-center justify-center gap-2 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
      disabled={disabled || pending}
      type="submit"
    >
      <Upload className="h-4 w-4" aria-hidden="true" />
      {pending ? "Uploading" : "Upload"}
    </button>
  );
}

export function ResumeUploadForm({ resumeCount }: { resumeCount: number }) {
  const [state, formAction] = useActionState<StudentActionState, FormData>(uploadResume, {});
  const limitReached = resumeCount >= 3;

  return (
    <form action={formAction} className="rounded-portal border border-portal-line bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <label className="flex flex-1 flex-col gap-2 text-sm font-medium text-portal-ink">
          Upload resume
          <input
            accept="application/pdf"
            className="w-full rounded-portal border border-portal-line bg-white px-3 py-2 text-sm file:mr-4 file:rounded-portal file:border-0 file:bg-portal-sky file:px-3 file:py-2 file:text-sm file:font-semibold file:text-portal-blue"
            disabled={limitReached}
            name="resume"
            required
            type="file"
          />
        </label>
        <SubmitButton disabled={limitReached} />
      </div>

      <div className="mt-4 flex flex-col gap-2 text-sm text-portal-muted md:flex-row md:items-center md:justify-between">
        <p>{resumeCount}/3 resumes uploaded. PDF only, 5 MB maximum.</p>
        {limitReached ? <p className="font-medium text-amber-700">Resume limit reached.</p> : null}
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