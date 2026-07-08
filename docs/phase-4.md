# Phase 4 Organizer Portal Notes

## What Phase 4 Adds

- Organizer dashboard uses live counts from Supabase.
- `/organizer/students` lists students, account state, resume count, and application count.
- `/organizer/resumes` verifies or rejects pending resumes with signed private links.
- `/organizer/roles` creates companies and internship roles, and updates role status.
- `/organizer/applications` lets organizers update application stages on behalf of recruiters.
- `/organizer/recruiters` lists recruiters and assigns recruiters to roles.
- `/organizer/reports` shows basic company/role application summaries.

## Backend Hooks Added

- `getOrganizerDashboardStats`
- `getStudentsForOrganizer`
- `getPendingResumesForOrganizer`
- `getCompaniesForOrganizer`
- `getRolesForOrganizer`
- `getAllApplicationsForOrganizer`
- `getRecruitersForOrganizer`
- `getReportsForOrganizer`
- `verifyResume`
- `rejectResume`
- `createCompany`
- `createInternshipRole`
- `updateInternshipRole`
- `updateApplicationStage`
- `assignRecruiterToRole`

## Provisioning Scaffold

- `scripts/generate-student-credentials.mjs` generates unique temporary student passwords as CSV output.
- `npm.cmd run provision:students:preview` previews the credentials CSV in the terminal.
- Redirect output to `student-credentials.csv` only when needed; that file is ignored by Git.
- Real Supabase auth user creation is intentionally deferred until project keys are configured.

## Known Constraint

The current seed contains 78 student emails: `ed23b001` through `ed23b074`, plus `ed23b078` through `ed23b081`.