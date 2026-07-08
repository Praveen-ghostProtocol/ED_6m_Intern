# Phase 1 Setup Notes

## Decisions

- App framework: Next.js with TypeScript.
- Backend: Supabase PostgreSQL, Auth, Storage, and Row Level Security.
- Styling direction: light, calm, academic-professional UI with blue, teal, mint, and peach accents.
- Access model: role-based access control enforced in the database and mirrored in the app shell.

## Roles

- `student`: can manage their own resumes and applications.
- `recruiter`: can view assigned roles and applications for only those roles.
- `organizer`: can manage students, recruiters, companies, roles, resume verification, applications, and reports.

## Student Email Set

Given set:

- `ed23b001@smail.iitm.ac.in` through `ed23b074@smail.iitm.ac.in`
- `ed23b078@smail.iitm.ac.in`
- `ed23b079@smail.iitm.ac.in`
- `ed23b080@smail.iitm.ac.in`
- `ed23b081@smail.iitm.ac.in`

This totals 78 students.

## Phase 1 Deliverables Added

- Base Next.js project files.
- Light color system and placeholder landing screen.
- Central RBAC role/navigation definitions.
- Supabase schema migration with core tables, constraints, triggers, and RLS policies.
- Student email CSV seed list.

## Next Phase

Phase 2 should implement authentication:

- Supabase client/server helpers.
- Login page.
- Role-aware redirect.
- Protected route middleware.
- First-login password change handling.
