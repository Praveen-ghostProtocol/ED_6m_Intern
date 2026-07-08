"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { LogIn } from "lucide-react";
import { signIn, type AuthActionState } from "@/app/auth/actions";

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      className="flex h-11 w-full items-center justify-center gap-2 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-70"
      disabled={pending}
      type="submit"
    >
      <LogIn className="h-4 w-4" aria-hidden="true" />
      {pending ? "Signing in" : "Sign in"}
    </button>
  );
}

export function LoginForm({ nextPath }: { nextPath?: string }) {
  const initialState: AuthActionState = {};
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <form action={formAction} className="mt-7 flex flex-col gap-4">
      <input name="next" type="hidden" value={nextPath ?? ""} />
      <label className="flex flex-col gap-2 text-sm font-medium text-portal-ink">
        Email
        <input
          autoComplete="email"
          className="h-11 rounded-portal border border-portal-line bg-white px-3 text-sm outline-none transition focus:border-portal-blue focus:ring-2 focus:ring-portal-sky"
          name="email"
          placeholder="ed23b001@smail.iitm.ac.in"
          required
          type="email"
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-portal-ink">
        Password
        <input
          autoComplete="current-password"
          className="h-11 rounded-portal border border-portal-line bg-white px-3 text-sm outline-none transition focus:border-portal-blue focus:ring-2 focus:ring-portal-sky"
          name="password"
          placeholder="Enter your password"
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