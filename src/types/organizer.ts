import type { ApplicationStatus, ResumeStatus } from "@/types/student";

export type RoleStatus = "draft" | "open" | "closed";

export type OrganizerDashboardStats = {
  students: number;
  companies: number;
  roles: number;
  applications: number;
  pendingResumes: number;
  offers: number;
};

export type OrganizerStudent = {
  id: string;
  roll_number: string;
  email: string;
  full_name: string | null;
  cgpa: number | null;
  branch: string;
  is_active: boolean;
  must_change_password: boolean;
  resume_count: number;
  application_count: number;
};

export type OrganizerResume = {
  id: string;
  student_id: string;
  file_name: string;
  storage_path: string;
  file_size_bytes: number;
  status: ResumeStatus;
  verification_note: string | null;
  uploaded_at: string;
  signed_url: string | null;
  student_roll_number: string;
  student_email: string;
  student_name: string | null;
};

export type OrganizerCompany = {
  id: string;
  name: string;
  description: string | null;
};

export type OrganizerRole = {
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

export type OrganizerApplication = {
  id: string;
  student_roll_number: string;
  student_email: string;
  student_name: string | null;
  company_name: string;
  role_title: string;
  resume_file_name: string;
  applied_at: string;
  gd_applicable: boolean;
  resume_shortlist_status: ApplicationStatus;
  test_status: ApplicationStatus;
  gd_status: ApplicationStatus;
  offer_status: ApplicationStatus;
};

export type OrganizerRecruiter = {
  id: string;
  profile_id: string;
  email: string;
  full_name: string | null;
  company_id: string;
  company_name: string;
  designation: string | null;
  assigned_roles: string[];
};

export type OrganizerReportRow = {
  company_name: string;
  role_title: string;
  application_count: number;
  resume_shortlists: number;
  test_shortlists: number;
  gd_shortlists: number;
  offers: number;
};