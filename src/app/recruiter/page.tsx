import { BriefcaseBusiness, UsersRound, ListChecks } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { requireRole } from "@/lib/auth/guards";
import { getRecruiterByProfileId, getRecruiterDashboardStats } from "@/lib/recruiter/queries";
import { recruiterNavigation } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function RecruiterDashboard() {
  const profile = await requireRole("recruiter");
  const recruiter = await getRecruiterByProfileId(profile.id);

  if (!recruiter) {
    return (
      <PortalShell navigation={recruiterNavigation} profile={profile} subtitle="Your recruiter account is active, but company details still need to be assigned." title="Recruiter Dashboard">
        <EmptyState title="Recruiter profile not found" description="Ask the internship organizer to link this login to a company and assigned roles." />
      </PortalShell>
    );
  }

  const stats = await getRecruiterDashboardStats(recruiter.id);
  const cards = [
    { label: "Assigned roles", value: stats.assignedRoles.toString(), icon: BriefcaseBusiness, tone: "bg-portal-sky text-portal-blue" },
    { label: "Applicants", value: stats.applicants.toString(), icon: UsersRound, tone: "bg-portal-mint text-portal-teal" },
    { label: "Pending decisions", value: stats.pendingDecisions.toString(), icon: ListChecks, tone: "bg-portal-peach text-amber-700" }
  ];

  return (
    <PortalShell navigation={recruiterNavigation} profile={profile} subtitle={`Review assigned roles and applicants for ${recruiter.company_name}.`} title="Recruiter Dashboard">
      <section className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={card.label}>
              <div className={`mb-5 flex h-10 w-10 items-center justify-center rounded-portal ${card.tone}`}>
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