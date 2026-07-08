import type { ApplicationStatus } from "@/types/student";
import type { RoleStatus } from "@/types/organizer";

export type RecruiterProfile = {
  id: string;
  profile_id: string;
  email: string;
  full_name: string | null;
  company_id: string;
  company_name: string;
  designation: string | null;
  is_active: boolean;
};

export type RecruiterDashboardStats = {
  assignedRoles: number;
  applicants: number;
  pendingDecisions: number;
};

export type RecruiterRole = {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  duration: string | null;
  stipend: string | null;
  location: string | null;
  deadline: string | null;
  gd_applicable: boolean;
  status: RoleStatus;
};

export type RecruiterApplication = {
  id: string;
  student_roll_number: string;
  student_email: string;
  student_name: string | null;
  student_cgpa: number | null;
  company_name: string;
  role_id: string;
  role_title: string;
  resume_file_name: string;
  resume_signed_url: string | null;
  applied_at: string;
  gd_applicable: boolean;
  resume_shortlist_status: ApplicationStatus;
  test_status: ApplicationStatus;
  gd_status: ApplicationStatus;
  offer_status: ApplicationStatus;
};