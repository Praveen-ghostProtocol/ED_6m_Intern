# Engineering Design Internship Portal

Role-based internship portal for Engineering Design students, recruiters, and internship organizers.

## Stack

- Next.js with TypeScript
- Supabase Auth, PostgreSQL, Storage, and Row Level Security
- Tailwind CSS
- Vercel-ready deployment

## Roles

- Student: upload up to three PDF resumes, register for open roles using verified resumes, and track application status.
- Recruiter: view assigned roles, review applicants, open submitted resumes, and update selection stages.
- Organizer: manage students, resume verification, companies, roles, recruiter assignments, applications, and reports.

## Local Setup

```text
npm.cmd install
copy .env.example .env.local
npm.cmd run dev
```

The UI can be previewed locally without Supabase values. Vercel production deployments require real Supabase public env values.

## Supabase Setup

See `docs/provisioning.md` for the full setup flow. Migration order:

```text
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_resume_storage.sql
supabase/migrations/003_api_grants_and_rls_fix.sql
supabase/migrations/004_service_role_grants.sql
supabase/migrations/005_student_profile_details.sql
```

## Useful Scripts

```text
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
npm.cmd run check:setup
npm.cmd run provision:students:preview
npm.cmd run provision:students
npm.cmd run provision:test-users
npm.cmd run provision:demo-data
npm.cmd run test:e2e:smoke
```

Provisioning scripts require `.env.local` with `SUPABASE_SERVICE_ROLE_KEY` and should be run only after the Supabase project is ready.

## Deployment

See `docs/deployment.md` for GitHub, Vercel, Supabase, and launch checklist details.

## Current Student Seed

The current seed contains 78 students: `ed23b001` through `ed23b074`, plus `ed23b078` through `ed23b081`.