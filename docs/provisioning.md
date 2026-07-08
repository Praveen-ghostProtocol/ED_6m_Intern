# Account Provisioning and Supabase Setup

Real account creation should run only after the Supabase project is created and `.env.local` contains production project keys.

## Supabase Project Setup

1. Create a Supabase project.
2. In the project dashboard, copy:
   - Project URL
   - anon public key
   - service role key
3. Create `.env.local` from `.env.example` and fill:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. In Supabase SQL Editor, run these migrations in order:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_resume_storage.sql`
   - `supabase/migrations/003_api_grants_and_rls_fix.sql`
   - `supabase/migrations/004_service_role_grants.sql`
5. Confirm the `resumes` bucket exists, is private, allows only PDFs, and has a 5 MB limit.

## Student Credentials Preview

This dry-run command does not contact Supabase:

```text
npm.cmd run provision:students:preview
```

Redirect only when you intentionally want a credentials file:

```text
npm.cmd run provision:students:preview > student-credentials.csv
```

## Real Provisioning Commands

Run these only after `.env.local` is configured:

```text
npm.cmd run provision:students > student-credentials.csv
npm.cmd run provision:test-users > test-user-credentials.csv
npm.cmd run provision:demo-data
npm.cmd run test:e2e:smoke
```

The scripts create or reuse existing auth users. If a user already exists, the provisioning script resets that user's temporary password and records the fresh password in the output CSV so partial runs stay recoverable.

## Test Accounts

Default test accounts:

- Organizer: `organizer.test@ed-internships.local`
- Recruiter: `recruiter.test@ed-internships.local`
- Student: `ed23b001@smail.iitm.ac.in`

The first two are created by `provision:test-users`. The demo recruiter row, demo company, demo role, and assignment are created by `provision:demo-data`.

## Student Seed

The current student seed contains 78 emails:

- `ed23b001@smail.iitm.ac.in` through `ed23b074@smail.iitm.ac.in`
- `ed23b078@smail.iitm.ac.in`
- `ed23b079@smail.iitm.ac.in`
- `ed23b080@smail.iitm.ac.in`
- `ed23b081@smail.iitm.ac.in`

## Credential Handling

- Generated credential CSV files are ignored by Git.
- Do not commit `.env.local`.
- Do not send `SUPABASE_SERVICE_ROLE_KEY` to the browser or share it with recruiters/students.
- Rotate/delete test accounts before final launch if they are no longer needed.