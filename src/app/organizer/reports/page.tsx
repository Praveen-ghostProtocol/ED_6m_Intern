import { Building2, ClipboardList, FileClock, Trophy } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { requireRole } from "@/lib/auth/guards";
import { organizerNavigation } from "@/lib/rbac";
import { getOrganizerDashboardStats, getReportsForOrganizer } from "@/lib/organizer/queries";

export const dynamic = "force-dynamic";

export default async function OrganizerReportsPage() {
  const profile = await requireRole("organizer");
  const [stats, rows] = await Promise.all([getOrganizerDashboardStats(), getReportsForOrganizer()]);
  const cards = [
    { label: "Roles", value: stats.roles, icon: Building2, tone: "bg-portal-sky text-portal-blue" },
    { label: "Applications", value: stats.applications, icon: ClipboardList, tone: "bg-portal-mint text-portal-teal" },
    { label: "Pending Resumes", value: stats.pendingResumes, icon: FileClock, tone: "bg-portal-peach text-amber-700" },
    { label: "Offers", value: stats.offers, icon: Trophy, tone: "bg-white text-portal-blue" }
  ];

  return (
    <PortalShell navigation={organizerNavigation} profile={profile} subtitle="Basic operational summaries for companies, roles, applications, and offers." title="Reports">
      <section className="mb-5 grid gap-4 md:grid-cols-4">{cards.map((card) => { const Icon = card.icon; return <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={card.label}><div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-portal border border-portal-line ${card.tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></div><p className="text-3xl font-semibold">{card.value}</p><p className="mt-1 text-sm text-portal-muted">{card.label}</p></article>; })}</section>
      {rows.length === 0 ? <EmptyState title="No report data yet" description="Reports will populate after students apply to published roles." /> : (
        <div className="overflow-hidden rounded-portal border border-portal-line bg-white shadow-sm"><div className="overflow-x-auto"><table className="w-full min-w-[860px] text-left text-sm"><thead className="bg-portal-sky text-xs uppercase tracking-wide text-slate-700"><tr><th className="px-4 py-3">Company</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Applications</th><th className="px-4 py-3">Resume Shortlists</th><th className="px-4 py-3">Test Shortlists</th><th className="px-4 py-3">GD Shortlists</th><th className="px-4 py-3">Offers</th></tr></thead><tbody className="divide-y divide-portal-line">{rows.map((row) => <tr key={`${row.company_name}-${row.role_title}`}><td className="px-4 py-4 font-semibold">{row.company_name}</td><td className="px-4 py-4 text-portal-muted">{row.role_title}</td><td className="px-4 py-4 text-portal-muted">{row.application_count}</td><td className="px-4 py-4 text-portal-muted">{row.resume_shortlists}</td><td className="px-4 py-4 text-portal-muted">{row.test_shortlists}</td><td className="px-4 py-4 text-portal-muted">{row.gd_shortlists}</td><td className="px-4 py-4 text-portal-muted">{row.offers}</td></tr>)}</tbody></table></div></div>
      )}
    </PortalShell>
  );
}