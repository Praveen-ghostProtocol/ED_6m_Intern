import { PortalShell } from "@/components/portal/PortalShell";
import { EmptyState } from "@/components/student/EmptyState";
import { VerifierCandidateTable } from "@/components/verifier/VerifierCandidateTable";
import { requireRole } from "@/lib/auth/guards";
import { verifierNavigation } from "@/lib/rbac";
import { getAssignedStudentsForVerifier } from "@/lib/verifier/queries";

export const dynamic = "force-dynamic";

export default async function VerifierResumesPage() {
  const profile = await requireRole("verifier");
  const students = await getAssignedStudentsForVerifier(profile.id);

  return (
    <PortalShell navigation={verifierNavigation} profile={profile} subtitle="Select a student first, then review their uploaded PDF resumes." title="My Resumes Verification">
      {students.length === 0 ? <EmptyState title="No assigned students" description="Organizer assignments will appear here." /> : <VerifierCandidateTable students={students} />}
    </PortalShell>
  );
}