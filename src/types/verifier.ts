import type { ResumeStatus } from "@/types/student";

export type VerifierDashboardStats = {
  assignedStudents: number;
  pendingMasterEntries: number;
  verifiedMasterEntries: number;
  rejectedMasterEntries: number;
  pendingResumes: number;
  verifiedResumes: number;
  rejectedResumes: number;
};

export type VerifierStudent = {
  id: string;
  roll_number: string;
  email: string;
  full_name: string | null;
  cgpa: number | null;
  branch_specialisation: string | null;
  master_entry_count: number;
  resume_count: number;
};

export type VerifierMasterResumeEntry = {
  id: string;
  student_id: string;
  title: string;
  description: string;
  link: string | null;
  status: ResumeStatus;
  verification_note: string | null;
  created_at: string;
  student_roll_number: string;
  student_email: string;
  student_name: string | null;
};

export type VerifierResume = {
  id: string;
  student_id: string;
  file_name: string;
  file_size_bytes: number;
  status: ResumeStatus;
  verification_note: string | null;
  uploaded_at: string;
  signed_url: string | null;
  student_roll_number: string;
  student_email: string;
  student_name: string | null;
};
export type VerifierStudentDetail = VerifierStudent & {
  master_entries: VerifierMasterResumeEntry[];
  resumes: VerifierResume[];
};
