# Phase 5 Recruiter Portal Notes

## What Phase 5 Adds

- Recruiter dashboard uses live counts for assigned roles, applicants, and pending decisions.
- `/recruiter/roles` lists only roles assigned to the logged-in recruiter.
- `/recruiter/applications` shows only applications for assigned roles with applicant details, resume links, filters, and stage controls.
- `/recruiter/profile` shows read-only recruiter account, company, and assigned roles.

## Backend Hooks Added

- `getRecruiterByProfileId`
- `getRecruiterDashboardStats`
- `getAssignedRolesForRecruiter`
- `getApplicationsForRecruiter`
- `updateRecruiterApplicationStage`

## Access Model

- All recruiter pages and mutations call `requireRole("recruiter")`.
- Recruiter data access relies on existing RLS policies and explicit role-assignment checks.
- Resume links are generated as short-lived signed Supabase Storage URLs.
- Status changes insert `status_history` records with the recruiter profile id.

## Known Constraint

Real recruiter testing requires Supabase auth users, recruiter profile rows, companies, roles, assignments, and student applications to exist in the connected Supabase project.