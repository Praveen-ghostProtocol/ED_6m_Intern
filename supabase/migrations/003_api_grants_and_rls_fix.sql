-- Fixes for projects created with "Automatically expose new tables" disabled.
-- Grants API privileges to authenticated users while keeping RLS as the real access boundary.

grant usage on schema public to authenticated;
grant usage on type public.app_role to authenticated;
grant usage on type public.resume_status to authenticated;
grant usage on type public.role_status to authenticated;
grant usage on type public.application_status to authenticated;

grant select on public.profiles to authenticated;
grant update (must_change_password) on public.profiles to authenticated;

grant select on public.students to authenticated;

grant select, insert on public.companies to authenticated;
grant select on public.recruiters to authenticated;
grant select, insert, update on public.internship_roles to authenticated;
grant select, insert, update on public.recruiter_role_assignments to authenticated;
grant select, insert, update on public.resumes to authenticated;
grant select, insert, update on public.applications to authenticated;
grant select, insert on public.status_history to authenticated;

create or replace function public.current_student_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select s.id
  from public.students s
  where s.profile_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_recruiter_for_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    where a.student_id = target_student_id
      and public.is_recruiter_for_role(a.role_id)
  );
$$;

create or replace function public.is_recruiter_for_resume(target_resume_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    where a.resume_id = target_resume_id
      and public.is_recruiter_for_role(a.role_id)
  );
$$;

create or replace function public.can_access_application(target_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.applications a
    where a.id = target_application_id
      and (
        public.is_organizer()
        or a.student_id = public.current_student_id()
        or public.is_recruiter_for_role(a.role_id)
      )
  );
$$;

create or replace function public.can_access_resume_path(target_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.resumes r
    where r.storage_path = target_storage_path
      and (
        public.is_organizer()
        or r.student_id = public.current_student_id()
        or public.is_recruiter_for_resume(r.id)
      )
  );
$$;

create or replace function public.can_delete_resume_path(target_storage_path text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.resumes r
    where r.storage_path = target_storage_path
      and r.student_id = public.current_student_id()
      and r.status = 'pending'
  );
$$;

grant execute on function public.current_student_id() to authenticated;
grant execute on function public.is_recruiter_for_student(uuid) to authenticated;
grant execute on function public.is_recruiter_for_resume(uuid) to authenticated;
grant execute on function public.can_access_application(uuid) to authenticated;
grant execute on function public.can_access_resume_path(text) to authenticated;
grant execute on function public.can_delete_resume_path(text) to authenticated;

drop policy if exists "profiles_self_update_password_flag" on public.profiles;
create policy "profiles_self_update_password_flag"
on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists "students_recruiter_applicant_select" on public.students;
create policy "students_recruiter_applicant_select"
on public.students for select
using (public.is_recruiter_for_student(id));

drop policy if exists "resumes_student_own_select" on public.resumes;
create policy "resumes_authorized_select"
on public.resumes for select
using (
  public.is_organizer()
  or student_id = public.current_student_id()
  or public.is_recruiter_for_resume(id)
);

drop policy if exists "resumes_student_insert" on public.resumes;
create policy "resumes_student_insert"
on public.resumes for insert
with check (student_id = public.current_student_id());

drop policy if exists "resumes_student_update_pending" on public.resumes;
create policy "resumes_student_update_pending"
on public.resumes for update
using (student_id = public.current_student_id() and status = 'pending')
with check (
  student_id = public.current_student_id()
  and status = 'pending'
  and verified_by is null
  and verified_at is null
);

drop policy if exists "applications_student_select" on public.applications;
create policy "applications_authorized_select"
on public.applications for select
using (
  public.is_organizer()
  or student_id = public.current_student_id()
  or public.is_recruiter_for_role(role_id)
);

drop policy if exists "applications_student_insert" on public.applications;
create policy "applications_student_insert"
on public.applications for insert
with check (student_id = public.current_student_id());

drop policy if exists "status_history_visible_by_scope" on public.status_history;
create policy "status_history_visible_by_scope"
on public.status_history for select
using (public.can_access_application(application_id));

drop policy if exists "status_history_recruiter_or_organizer_insert" on public.status_history;
create policy "status_history_recruiter_or_organizer_insert"
on public.status_history for insert
with check (
  public.is_organizer()
  or exists (
    select 1
    from public.applications a
    where a.id = status_history.application_id
      and public.is_recruiter_for_role(a.role_id)
  )
);

drop policy if exists "resume_objects_authorized_select" on storage.objects;
create policy "resume_objects_authorized_select"
on storage.objects for select
using (
  bucket_id = 'resumes'
  and public.can_access_resume_path(name)
);

drop policy if exists "resume_objects_student_delete_pending" on storage.objects;
create policy "resume_objects_student_delete_pending"
on storage.objects for delete
using (
  bucket_id = 'resumes'
  and public.can_delete_resume_path(name)
);