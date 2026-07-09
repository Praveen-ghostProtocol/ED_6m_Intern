export type ResumeStatus = "pending" | "verified" | "rejected";
export type ApplicationStatus =
  | "pending"
  | "shortlisted"
  | "rejected"
  | "not_applicable"
  | "selected"
  | "offer_given";

export const branchSpecialisations = ["Automotive", "Biomedical", "IDDD"] as const;

export const genderOptions = ["Female", "Male", "Non-binary", "Prefer not to say"] as const;

export type BranchSpecialisation = (typeof branchSpecialisations)[number];
export type GenderOption = (typeof genderOptions)[number];

export type StudentRecord = {
  id: string;
  profile_id: string;
  roll_number: string;
  cgpa: number | null;
  phone: string | null;
  alternate_phone: string | null;
  alternate_email: string | null;
  date_of_birth: string | null;
  gender: string | null;
  current_address_pincode: string | null;
  current_address: string | null;
  permanent_address_pincode: string | null;
  permanent_address: string | null;
  branch: string;
  branch_specialisation: string | null;
  profile_completed_at: string | null;
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
  location: string | null;
  eligibility: string | null;
  job_description: string;
  jd_file_name: string | null;
  jd_signed_url: string | null;
  selection_process: string | null;
  gd_applicable: boolean;
  deadline: string | null;
  application_id: string | null;
  application_resume_id: string | null;
  application_resume_file_name: string | null;
  has_applied: boolean;
};

export type StudentApplication = {
  id: string;
  applied_at: string;
  resume_shortlist_status: ApplicationStatus;
  test_attended: boolean | null;
  test_status: ApplicationStatus;
  gd_status: ApplicationStatus;
  offer_status: ApplicationStatus;
  role_title: string;
  company_name: string;
  resume_file_name: string;
};