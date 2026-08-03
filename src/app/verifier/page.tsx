import { FileClock, FileText, UsersRound, XCircle } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { requireRole } from "@/lib/auth/guards";
import { verifierNavigation } from "@/lib/rbac";
import { getVerifierDashboardStats } from "@/lib/verifier/queries";

export const dynamic = "force-dynamic";

export default async function VerifierDashboardPage() {
  const profile = await requireRole("verifier");
  const stats = await getVerifierDashboardStats(profile.id);
  const cards = [
    { label: "Assigned students", value: stats.assignedStudents, icon: UsersRound, tone: "bg-portal-sky text-portal-blue" },
    { label: "Pending master entries", value: stats.pendingMasterEntries, icon: FileText, tone: "bg-portal-mint text-emerald-700" },
    { label: "Pending PDF resumes", value: stats.pendingResumes, icon: FileClock, tone: "bg-portal-peach text-amber-700" },
    { label: "Rejected entries", value: stats.rejectedMasterEntries, icon: XCircle, tone: "bg-red-50 text-red-700" }
  ];

  return (
    <PortalShell navigation={verifierNavigation} profile={profile} subtitle="Review assigned students' resume material and PDF uploads." title="Verifier Dashboard">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <article className="rounded-portal border border-portal-line bg-white p-5 shadow-sm" key={card.label}>
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-portal ${card.tone}`}><Icon className="h-5 w-5" aria-hidden="true" /></div>
              <p className="text-sm text-portal-muted">{card.label}</p>
              <p className="mt-2 text-3xl font-semibold text-portal-ink">{card.value}</p>
            </article>
          );
        })}
      </section>
    </PortalShell>
  );
}