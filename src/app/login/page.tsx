import { ShieldCheck } from "lucide-react";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="flex min-h-screen items-center justify-center bg-portal-canvas px-6 py-10 text-portal-ink">
      <section className="grid w-full max-w-5xl overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm md:grid-cols-[1fr_0.9fr]">
        <div className="flex min-h-[520px] flex-col justify-between bg-portal-sky p-8 md:p-10">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-portal-teal">
              Engineering Design
            </p>
            <h1 className="mt-3 max-w-lg text-3xl font-semibold leading-tight md:text-4xl">
              Internship Portal Login
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-700">
              Students, company accounts, and organizers use one secure entry point. Access after login is decided by your assigned role.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-portal border border-blue-200 bg-white/70 px-4 py-3 text-sm text-slate-700">
            <ShieldCheck className="h-5 w-5 text-portal-teal" aria-hidden="true" />
            Backend role checks protect every portal area.
          </div>
        </div>
        <div className="p-8 md:p-10">
          <h2 className="text-2xl font-semibold">Sign in</h2>
          <p className="mt-2 text-sm leading-6 text-portal-muted">
            Use the credentials shared by the internship team.
          </p>
          <LoginForm nextPath={params.next} />
        </div>
      </section>
    </main>
  );
}