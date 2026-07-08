# Step 6 Supabase Connection Notes

## What Step 6 Adds

- Student seed corrected to 78 students.
- Real provisioning scripts added for students, test users, and demo data.
- Provisioning docs expanded with Supabase setup, migration order, credential handling, and E2E validation guidance.

## Scripts

- `npm.cmd run provision:students:preview`
  - Local-only CSV preview with generated temporary passwords.
- `npm.cmd run provision:students`
  - Creates/reuses 78 student auth users, profiles, and student rows.
- `npm.cmd run provision:test-users`
  - Creates/reuses one organizer and one recruiter auth/profile for testing.
- `npm.cmd run provision:demo-data`
  - Creates/reuses demo company, demo role, recruiter row, and recruiter-role assignment.

## Manual Supabase Step Still Required

A Supabase project must be created manually and `.env.local` must be filled before real provisioning can run. The scripts intentionally fail fast if the project URL or service-role key is missing.

## End-to-End Validation Path

1. Apply migrations in Supabase SQL Editor.
2. Run provisioning scripts.
3. Start the app with real `.env.local` values.
4. Log in as `ed23b001@smail.iitm.ac.in` using the generated temporary password.
5. Change password on first login.
6. Upload a PDF resume.
7. Log in as organizer test account and verify the resume.
8. Confirm demo company/role exists and is assigned to the demo recruiter.
9. Log back in as student and apply with the verified resume.
10. Log in as recruiter test account and update selection statuses.
11. Confirm student status and organizer reports reflect the changes.