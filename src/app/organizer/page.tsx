import { Building2, FileClock, GraduationCap, Trophy } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth/guards";
import { organizerNavigation } from "@/lib/rbac";
import { getOrganizerDashboardStats } from "@/lib/organizer/queries";

export const dynamic = "force-dynamic";

export default async function OrganizerDashboard() {
  const profile = await requireRole("organizer");
  const stats = await getOrganizerDashboardStats();
  const cards = [
    { label: "Eligible students", value: stats.students.toString(), icon: GraduationCap, tone: "bg-portal-sky text-portal-blue" },
    { label: "Companies", value: stats.companies.toString(), icon: Building2, tone: "bg-portal-mint text-portal-teal" },
    { label: "Pending resumes", value: stats.pendingResumes.toString(), icon: FileClock, tone: "bg-portal-peach text-amber-700" },
    { label: "Offers", value: stats.offers.toString(), icon: Trophy, tone: "bg-white text-portal-blue" }
  ];

  return (
    <PortalShell navigation={organizerNavigation} profile={profile} subtitle="Control student access, resume verification, companies, recruiters, and reports." title="Organizer Dashboard">
      <section className="grid gap-4 md:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={card.label}>
              <div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-portal border border-portal-line ${card.tone}`}>
                <Icon className="h-5 w-5" aria-hidden="true" />
              </div>
              <p className="text-3xl font-semibold">{card.value}</p>
              <p className="mt-1 text-sm text-portal-muted">{card.label}</p>
            </article>
          );
        })}
      </section>
    </PortalShell>
  );
}