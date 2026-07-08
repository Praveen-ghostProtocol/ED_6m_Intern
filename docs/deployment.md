# Deployment Guide

## 1. Pre-Deployment Checks

Run locally:

```text
npm.cmd run check:setup
npm.cmd run typecheck
npm.cmd run lint
npm.cmd run build
```

`check:setup` may warn if `.env.local` is missing. Warnings are acceptable before Supabase is created; failures should be fixed before deployment.

## 2. Supabase Setup

1. Create a Supabase project.
2. Copy the project URL, anon key, and service-role key.
3. Run migrations in Supabase SQL Editor in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_resume_storage.sql`
   - `supabase/migrations/003_api_grants_and_rls_fix.sql`
   - `supabase/migrations/004_service_role_grants.sql`
4. Confirm the `resumes` bucket is private, PDF-only, and has a 5 MB limit.
5. In Auth settings, disable or bypass email confirmation for the initial internal password-based test.

## 3. Provisioning

Create `.env.local` locally with:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Then run:

```text
npm.cmd run provision:students > student-credentials.csv
npm.cmd run provision:test-users > test-user-credentials.csv
npm.cmd run provision:demo-data
npm.cmd run test:e2e:smoke
```

Keep generated credential CSV files private. They are ignored by Git.

## 4. GitHub Setup

1. Commit the project.
2. Push to GitHub.
3. The included CI workflow uses placeholder public Supabase values so pull requests can build without secrets. Add GitHub Actions secrets only if you later change CI to build against production env values:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Never add `SUPABASE_SERVICE_ROLE_KEY` unless a workflow specifically needs server-side provisioning. The included CI workflow does not need it.

## 5. Vercel Setup

1. Import the GitHub repo into Vercel.
2. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Do not expose `SUPABASE_SERVICE_ROLE_KEY` to client-side code.
4. Deploy.

## 6. Launch Checklist

- Student login works with temporary password.
- First-login password change works.
- Resume upload works for PDFs under 5 MB.
- Organizer can verify resumes.
- Student can apply with verified resume only.
- Recruiter can view only assigned applicants.
- Status updates appear in student and organizer views.
- Reports reflect application and offer counts.