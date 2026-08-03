import Link from "next/link";
import { ArrowRight, ShieldCheck, UserRound, Building2, LayoutDashboard, ClipboardCheck } from "lucide-react";

const portals = [
  {
    title: "Student Portal",
    description: "Upload verified resumes, build your master resume, browse roles, and track application status.",
    href: "/login?next=/student",
    icon: UserRound
  },
  {
    title: "Company Portal",
    description: "Create roles, review applicants role-wise, and update shortlist stages.",
    href: "/login?next=/recruiter",
    icon: Building2
  },
  {
    title: "Verifier Portal",
    description: "Review assigned students' master resume entries and uploaded PDF resumes.",
    href: "/login?next=/verifier",
    icon: ClipboardCheck
  },
  {
    title: "Organizer Portal",
    description: "Manage students, verification, roles, company accounts, verifier assignments, and reports.",
    href: "/login?next=/organizer",
    icon: LayoutDashboard
  }
];

export default function Home() {
  return (
    <main className="min-h-screen bg-portal-canvas px-6 py-8 text-portal-ink">
      <section className="mx-auto flex max-w-6xl flex-col gap-8">
        <header className="flex flex-col gap-4 border-b border-portal-line pb-6 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-portal-teal">
              Engineering Design
            </p>
            <h1 className="mt-2 text-3xl font-semibold md:text-4xl">
              Internship Portal
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-portal-muted">
              A light, role-based workspace for students, companies, verifiers, and the internship team.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2 rounded-portal border border-portal-line bg-white px-4 py-3 text-sm text-portal-muted">
              <ShieldCheck className="h-5 w-5 text-portal-teal" aria-hidden="true" />
              RBAC enforced by backend policies
            </div>
            <Link
              className="flex h-11 items-center justify-center gap-2 rounded-portal bg-portal-blue px-4 text-sm font-semibold text-white transition hover:bg-blue-700"
              href="/login"
            >
              Sign in
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {portals.map((portal) => {
            const Icon = portal.icon;

            return (
              <Link
                className="group rounded-portal border border-portal-line bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-portal-blue focus:ring-offset-2"
                href={portal.href}
                key={portal.title}
              >
                <div className="mb-5 flex h-11 w-11 items-center justify-center rounded-portal bg-portal-sky text-portal-blue transition group-hover:bg-blue-100">
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold">{portal.title}</h2>
                  <ArrowRight className="h-4 w-4 text-portal-muted transition group-hover:translate-x-1 group-hover:text-portal-blue" aria-hidden="true" />
                </div>
                <p className="mt-2 text-sm leading-6 text-portal-muted">
                  {portal.description}
                </p>
              </Link>
            );
          })}
        </section>
      </section>
    </main>
  );
}