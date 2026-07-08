# QA Checklist

## Access Control

- Logged-out users opening `/student`, `/recruiter`, or `/organizer` are redirected to `/login`.
- Student users cannot access recruiter or organizer routes.
- Recruiter users cannot access student or organizer routes.
- Organizer users cannot access student or recruiter routes.

## Student Flow

- Student logs in with temporary password.
- Student is forced to change password on first login.
- Student completes required profile details after first login.
- Email and roll number are read-only in the profile form.
- Student uploads a PDF resume under 5 MB.
- Student cannot upload more than three resumes.
- Pending resumes cannot be used for applications.
- Verified resumes appear in the company registration flow.
- Student cannot apply twice to the same role.

## Organizer Flow

- Organizer sees students list with 78 imported students.
- Organizer sees pending resumes.
- Organizer can verify a pending resume.
- Organizer can reject a pending resume with a note.
- Organizer can create a company.
- Organizer can create a draft/open/closed role.
- Only open roles appear to students.
- Organizer can assign recruiter to role.
- Organizer can update application statuses.
- Organizer reports update after applications and offers change.

## Recruiter Flow

- Recruiter sees only assigned roles.
- Recruiter sees only applicants for assigned roles.
- Recruiter can open submitted resume signed links.
- Recruiter can update resume shortlist, test, GD, and offer statuses.
- GD status is locked to Not Applicable when the role has no GD.
- Status updates are visible to the student.

## Storage and Security

- Resume bucket is private.
- Resume links are signed and short-lived.
- Non-assigned recruiters cannot access unrelated resumes or applications.
- Generated credential CSVs are not committed.
- `.env.local` is not committed.

## Build and Deployment

- `npm.cmd run check:setup` passes required checks.
- `npm.cmd run typecheck` passes.
- `npm.cmd run lint` passes.
- `npm.cmd run build` passes.
- Vercel deployment has required environment variables.