export const roles = ["student", "recruiter", "organizer", "verifier"] as const;

export type AppRole = (typeof roles)[number];

export const roleHomePath: Record<AppRole, string> = {
  student: "/student",
  recruiter: "/recruiter",
  organizer: "/organizer",
  verifier: "/verifier"
};

export const studentNavigation = [
  { label: "My Resumes", href: "/student/resumes" },
  { label: "Master Resume", href: "/student/master-resume" },
  { label: "Companies", href: "/student/companies" },
  { label: "Applied Companies", href: "/student/applications" },
  { label: "Profile", href: "/student/profile" }
];

export const recruiterNavigation = [
  { label: "Dashboard", href: "/recruiter" },
  { label: "Company Roles", href: "/recruiter/roles" },
  { label: "Applications", href: "/recruiter/applications" },
  { label: "Company Account", href: "/recruiter/profile" }
];

export const organizerNavigation = [
  { label: "Dashboard", href: "/organizer" },
  { label: "Students", href: "/organizer/students" },
  { label: "Resume Verification", href: "/organizer/resumes" },
  { label: "Companies & Roles", href: "/organizer/roles" },
  { label: "Applications", href: "/organizer/applications" },
  { label: "Company Accounts", href: "/organizer/recruiters" },
  { label: "Verifiers", href: "/organizer/verifiers" },
  { label: "Reports", href: "/organizer/reports" }
];

export const verifierNavigation = [
  { label: "Dashboard", href: "/verifier" },
  { label: "Assigned Students", href: "/verifier/students" },
  { label: "Master Resume", href: "/verifier/master-resume" },
  { label: "My Resumes", href: "/verifier/resumes" }
];