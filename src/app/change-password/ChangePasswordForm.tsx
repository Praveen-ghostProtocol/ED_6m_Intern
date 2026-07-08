"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { KeyRound } from "lucide-react";
import { changePassword, type AuthActionState } from "@/app/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-11 w-full items-center justify-center gap-2 rounded-portal bg-portal-teal px-4 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      <KeyRound className="h-4 w-4" aria-hidden="true" />
      {pending ? "Updating" : "Update password"}
    </button>
  );
}

export function ChangePasswordForm() {
  const [state, formAction] = useActionState<AuthActionState, FormData>(changePassword, {});

  return (
    <form action={formAction} className="mt-7 flex flex-col gap-4">
      <label className="flex flex-col gap-2 text-sm font-medium text-portal-ink">
        New password
        <input
          autoComplete="new-password"
          className="h-11 rounded-portal border border-portal-line bg-white px-3 text-sm outline-none transition focus:border-portal-teal focus:ring-2 focus:ring-portal-mint"
          minLength={8}
          name="password"
          required
          type="password"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-portal-ink">
        Confirm password
        <input
          autoComplete="new-password"
          className="h-11 rounded-portal border border-portal-line bg-white px-3 text-sm outline-none transition focus:border-portal-teal focus:ring-2 focus:ring-portal-mint"
          minLength={8}
          name="confirmPassword"
          required
          type="password"
        />
      </label>
      {state.error ? (
        <p className="rounded-portal border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      ) : null}
      <SubmitButton />
    </form>
  );
}