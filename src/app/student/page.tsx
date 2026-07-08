import { FileCheck2, Building2, ClipboardList } from "lucide-react";
import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { requireRole } from "@/lib/auth/guards";
import { studentNavigation } from "@/lib/rbac";
import {
  getOpenCompanyRoles,
  getStudentApplications,
  getStudentByProfileId,
  getStudentResumes
} from "@/lib/student/queries";

export const dynamic = "force-dynamic";

export default async function StudentDashboard() {
  const profile = await requireRole("student");
  const student = await getStudentByProfileId(profile.id);

  if (!student) {
    return (
      <PortalShell
        navigation={studentNavigation}
        profile={profile}
        subtitle="Your account is active, but student details still need to be imported."
        title="Student Dashboard"
      >
        <EmptyState
          description="Ask the internship organizer to import your roll number, CGPA, and branch details before using the student portal."
          title="Student profile not found"
        />
      </PortalShell>
    );
  }

  const [resumes, roles, applications] = await Promise.all([
    getStudentResumes(student.id),
    getOpenCompanyRoles(student.id),
    getStudentApplications(student.id)
  ]);

  const cards = [
    {
      label: "Verified resumes",
      value: resumes.filter((resume) => resume.status === "verified").length.toString(),
      icon: FileCheck2,
      tone: "bg-portal-mint text-portal-teal"
    },
    {
      label: "Open roles",
      value: roles.length.toString(),
      icon: Building2,
      tone: "bg-portal-sky text-portal-blue"
    },
    {
      label: "Applications",
      value: applications.length.toString(),
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