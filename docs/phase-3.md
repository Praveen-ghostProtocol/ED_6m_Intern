# Phase 3 Student Portal Notes

## What Phase 3 Adds

- `/student/resumes`
  - Upload PDF resume.
  - Shows uploaded resumes.
  - Shows verification status.
  - Enforces the 3-resume limit in the UI and server action.
  - Uses Supabase Storage signed links for private resume viewing.

- `/student/companies`
  - Shows open company roles in table format.
  - Opens a job description modal on the same page.
  - Shows role title, duration, stipend, location, eligibility, job description, selection process, deadline, and GD applicability.
  - Allows registration only through verified resumes.

- `/student/applications`
  - Shows applications submitted by the student.
  - Tracks resume shortlist, test shortlist, GD shortlist, and offer status.

## Backend Hooks Added

- `uploadResume`
  - Confirms student role.
  - Confirms student profile exists.
  - Validates PDF file type.
  - Enforces 5 MB max file size.
  - Checks max 3 resumes before upload.
  - Uploads to private `resumes` storage bucket.
  - Inserts resume metadata with `pending` verification status.

- `applyToRole`
  - Confirms student role.
  - Confirms role is open.
  - Confirms selected resume belongs to student.
  - Confirms selected resume is verified.
  - Creates application record.
  - Uses database unique constraint to prevent duplicate applications.

## Supabase Storage Migration

`supabase/migrations/002_resume_storage.sql` creates the private `resumes` bucket and storage object policies for:

- student upload into their own folder
- authorized resume viewing
- student deletion of pending resume objects, for a later delete feature

## Still Pending Until Real Supabase Is Connected

- Apply migrations to the real Supabase project.
- Create auth users and profile/student rows.
- Create the private storage bucket through migration.
- Test real PDF upload and signed resume viewing.
- Add organizer-side resume verification UI in a later phase.