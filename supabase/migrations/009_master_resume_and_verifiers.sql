-- Master resume fragments and one-student-to-one-verifier assignment workflow.

create table if not exists public.student_verifier_assignments (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null unique references public.students(id) on delete cascade,
  verifier_profile_id uuid not null references public.profiles(id) on delete cascade,
  assigned_by uuid references public.profiles(id),
  assigned_at timestamptz not null default now()
);

create table if not exists public.master_resume_entries (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  title text not null,
  description text not null,
  link text,
  status public.resume_status not null default 'pending',
  verification_note text,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint master_resume_title_required check (length(trim(title)) > 0),
  constraint master_resume_description_required check (length(trim(description)) > 0),
  constraint master_resume_link_url check (link is null or link ~* '^https?://')
);

drop trigger if exists master_resume_entries_touch_updated_at on public.master_resume_entries;
create trigger master_resume_entries_touch_updated_at
before update on public.master_resume_entries
for each row execute function public.touch_updated_at();

create or replace function public.is_verifier()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'verifier';
$$;

create or replace function public.is_verifier_for_student(target_student_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.student_verifier_assignments sva
    where sva.student_id = target_student_id
      and sva.verifier_profile_id = auth.uid()
  );
$$;

create or replace function public.is_verifier_for_resume(target_resume_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.resumes r
    where r.id = target_resume_id
      and public.is_verifier_for_student(r.student_id)
  );
$$;

create or replace function public.validate_student_master_resume_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() = 'student' then
    if old.student_id <> public.current_student_id() then
      raise exception 'Students can only update their own master resume entries.';
    end if;

    if old.status <> 'rejected' then
      raise exception 'Only rejected master resume entries can be edited.';
    end if;

    if new.student_id <> old.student_id
      or new.status <> 'pending'
      or new.verification_note is not null
      or new.verified_by is not null
      or new.verified_at is not null then
      raise exception 'Rejected entries can only be edited and resubmitted for verification.';
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists master_resume_entries_student_update_guard on public.master_resume_entries;
create trigger master_resume_entries_student_update_guard
before update on public.master_resume_entries
for each row execute function public.validate_student_master_resume_update();

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
        or public.is_verifier_for_resume(r.id)
      )
  );
$$;

alter table public.student_verifier_assignments enable row level security;
alter table public.master_resume_entries enable row level security;

grant select, insert, update on public.student_verifier_assignments to authenticated;
grant select, insert, update on public.master_resume_entries to authenticated;
grant all privileges on public.student_verifier_assignments to service_role;
grant all privileges on public.master_resume_entries to service_role;
grant execute on function public.is_verifier() to authenticated;
grant execute on function public.is_verifier_for_student(uuid) to authenticated;
grant execute on function public.is_verifier_for_resume(uuid) to authenticated;
grant execute on function public.validate_student_master_resume_update() to authenticated;

drop policy if exists "profiles_verifier_assigned_student_select" on public.profiles;
create policy "profiles_verifier_assigned_student_select"
on public.profiles for select
using (
  exists (
    select 1
    from public.students s
    where s.profile_id = profiles.id
      and public.is_verifier_for_student(s.id)
  )
);

drop policy if exists "students_verifier_assigned_select" on public.students;
create policy "students_verifier_assigned_select"
on public.students for select
using (public.is_verifier_for_student(id));

drop policy if exists "verifier_assignments_visible_by_scope" on public.student_verifier_assignments;
create policy "verifier_assignments_visible_by_scope"
on public.student_verifier_assignments for select
using (
  public.is_organizer()
  or verifier_profile_id = auth.uid()
  or student_id = public.current_student_id()
);

drop policy if exists "verifier_assignments_organizer_manage" on public.student_verifier_assignments;
create policy "verifier_assignments_organizer_manage"
on public.student_verifier_assignments for all
using (public.is_organizer())
with check (public.is_organizer());

drop policy if exists "master_resume_entries_visible_by_scope" on public.master_resume_entries;
create policy "master_resume_entries_visible_by_scope"
on public.master_resume_entries for select
using (
  public.is_organizer()
  or student_id = public.current_student_id()
  or public.is_verifier_for_student(student_id)
);

drop policy if exists "master_resume_entries_student_insert" on public.master_resume_entries;
create policy "master_resume_entries_student_insert"
on public.master_resume_entries for insert
with check (student_id = public.current_student_id() and status = 'pending');

drop policy if exists "master_resume_entries_student_update_rejected" on public.master_resume_entries;
create policy "master_resume_entries_student_update_rejected"
on public.master_resume_entries for update
using (student_id = public.current_student_id() and status = 'rejected')
with check (student_id = public.current_student_id() and status = 'pending');

drop policy if exists "master_resume_entries_verifier_or_organizer_update" on public.master_resume_entries;
create policy "master_resume_entries_verifier_or_organizer_update"
on public.master_resume_entries for update
using (public.is_organizer() or public.is_verifier_for_student(student_id))
with check (public.is_organizer() or public.is_verifier_for_student(student_id));

drop policy if exists "resumes_authorized_select" on public.resumes;
create policy "resumes_authorized_select"
on public.resumes for select
using (
  public.is_organizer()
  or student_id = public.current_student_id()
  or public.is_recruiter_for_resume(id)
  or public.is_verifier_for_resume(id)
);

drop policy if exists "resumes_verifier_or_organizer_update" on public.resumes;
create policy "resumes_verifier_or_organizer_update"
on public.resumes for update
using (public.is_organizer() or public.is_verifier_for_resume(id))
with check (public.is_organizer() or public.is_verifier_for_resume(id));