export const roles = ["student", "recruiter", "organizer"] as const;

export type AppRole = (typeof roles)[number];

export const roleHomePath: Record<AppRole, string> = {
  student: "/student",
  recruiter: "/recruiter",
  organizer: "/organizer"
};

export const studentNavigation = [
  { label: "My Resumes", href: "/student/resumes" },
  { label: "Companies", href: "/student/companies" },
  { label: "Applied Companies", href: "/student/applications" },
  { label: "Profile", href: "/student/profile" }
];

export const recruiterNavigation = [
  { label: "Dashboard", href: "/recruiter" },
  { label: "Roles", href: "/recruiter/roles" },
  { label: "Applications", href: "/recruiter/applications" },
  { label: "Profile", href: "/recruiter/profile" }
];

export const organizerNavigation = [
  { label: "Dashboard", href: "/organizer" },
  { label: "Students", href: "/organizer/students" },
  { label: "Resume Verification", href: "/organizer/resumes" },
  { label: "Companies & Roles", href: "/organizer/roles" },
  { label: "Applications", href: "/organizer/applications" },
  { label: "Recruiters", href: "/organizer/recruiters" },
  { label: "Reports", href: "/organizer/reports" }
];
