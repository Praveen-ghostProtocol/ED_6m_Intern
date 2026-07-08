import { redirect } from "next/navigation";
import { KeyRound } from "lucide-react";
import { getCurrentProfile } from "@/lib/auth/guards";
import { ChangePasswordForm } from "./ChangePasswordForm";

export const dynamic = "force-dynamic";

export default async function ChangePasswordPage() {
  const profile = await getCurrentProfile();

  if (!profile) {
    redirect("/login");
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-portal-canvas px-6 py-10 text-portal-ink">
      <section className="w-full max-w-md rounded-portal border border-portal-line bg-white p-8 shadow-sm">
        <div className="flex h-12 w-12 items-center justify-center rounded-portal bg-portal-mint text-portal-teal">
          <KeyRound className="h-5 w-5" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-2xl font-semibold">Change password</h1>
        <p className="mt-2 text-sm leading-6 text-portal-muted">
          Set a private password before entering the portal.
        </p>
        <ChangePasswordForm />
      </section>
    </main>
  );
}