export type ResumeStatus = "pending" | "verified" | "rejected";
export type ApplicationStatus =
  | "pending"
  | "shortlisted"
  | "rejected"
  | "not_applicable"
  | "selected"
  | "offer_given";

export type StudentRecord = {
  id: string;
  profile_id: string;
  roll_number: string;
  cgpa: number | null;
  phone: string | null;
  branch: string;
};

export type StudentResume = {
  id: string;
  student_id: string;
  file_name: string;
  storage_path: string;
  file_size_bytes: number;
  status: ResumeStatus;
  verification_note: string | null;
  uploaded_at: string;
  signed_url: string | null;
};

export type VerifiedResumeChoice = {
  id: string;
  file_name: string;
  uploaded_at: string;
};

export type CompanyRole = {
  id: string;
  company_id: string;
  company_name: string;
  title: string;
  duration: string | null;
  stipend: string | null;
  location: string | null;
  eligibility: string | null;
  job_description: string;
  selection_process: string | null;
  gd_applicable: boolean;
  deadline: string | null;
  has_applied: boolean;
};

export type StudentApplication = {
  id: string;
  applied_at: string;
  resume_shortlist_status: ApplicationStatus;
  test_status: ApplicationStatus;
  gd_status: ApplicationStatus;
  offer_status: ApplicationStatus;
  role_title: string;
  company_name: string;
  resume_file_name: string;
};