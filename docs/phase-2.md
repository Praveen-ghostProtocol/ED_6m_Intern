# Phase 2 Authentication Notes

## What Phase 2 Adds

- Supabase browser and server clients.
- Email/password login through Supabase Auth.
- Server actions for sign in, password change, and sign out.
- Middleware session refresh.
- Route protection for `/student`, `/recruiter`, and `/organizer`.
- Role-based redirects using `profiles.role`.
- First-login password change using `profiles.must_change_password`.
- Basic protected dashboard shells for all three roles.

## Required Supabase Environment Variables

Create `.env.local` from `.env.example` and set:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

The service role key must stay server-only. Do not expose it to the browser.

## Login Requirement

Every authenticated user must have a matching row in `public.profiles` where:

- `profiles.id = auth.users.id`
- `profiles.role` is one of `student`, `recruiter`, or `organizer`
- `profiles.is_active = true`

If `must_change_password = true`, the user is redirected to `/change-password` before entering the portal.

## RBAC Behavior

- Students can only enter `/student` routes.
- Recruiters can only enter `/recruiter` routes.
- Organizers can only enter `/organizer` routes.
- Wrong-role access redirects the user back to their own role dashboard.
- Server pages still call `requireRole`, so access is checked even if middleware changes later.

## Next Step

Phase 3 can build the Student Portal features:

- My Resumes tab
- PDF upload
- max 3 resume rule connected to Supabase Storage
- resume verification status display
- Companies table
- JD modal
- verified-resume-only application flow