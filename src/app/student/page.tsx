import { FileCheck2, Building2, ClipboardList } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { studentNavigation } from "@/lib/rbac";
import { requireStudent } from "@/lib/student/guards";
import { getStudentDashboardStats } from "@/lib/student/queries";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const { profile, student } = await requireStudent();

  const stats = await getStudentDashboardStats(student.id);

  const cards = [
    {
      label: "Verified resumes",
      value: stats.verifiedResumes.toString(),
      icon: FileCheck2,
      tone: "bg-portal-mint text-portal-teal"
    },
    {
      label: "Open roles",
      value: stats.openRoles.toString(),
      icon: Building2,
      tone: "bg-portal-sky text-portal-blue"
    },
    {
      label: "Applications",
      value: stats.applications.toString(),
      icon: ClipboardList,
      tone: "bg-portal-peach text-amber-700"
    }
  ];

  return (
    <PortalShell
      navigation={studentNavigation}
      profile={profile}
      subtitle="Manage resumes, register for companies, and track selection status."
      title="Student Dashboard"
    >
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
