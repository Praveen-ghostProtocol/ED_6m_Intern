create extension if not exists "pgcrypto";

create type public.app_role as enum ('student', 'recruiter', 'organizer');
create type public.resume_status as enum ('pending', 'verified', 'rejected');
create type public.role_status as enum ('draft', 'open', 'closed');
create type public.application_status as enum ('pending', 'shortlisted', 'rejected', 'not_applicable', 'selected', 'offer_given');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null unique,
  role public.app_role not null,
  full_name text,
  must_change_password boolean not null default true,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.students (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  roll_number text not null unique,
  cgpa numeric(4, 2),
  phone text,
  branch text not null default 'Engineering Design',
  created_at timestamptz not null default now(),
  constraint students_cgpa_range check (cgpa is null or (cgpa >= 0 and cgpa <= 10))
);

create table public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  description text,
  logo_path text,
  created_at timestamptz not null default now()
);

create table public.recruiters (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null unique references public.profiles(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  designation text,
  created_at timestamptz not null default now()
);

create table public.internship_roles (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  title text not null,
  duration text,
  stipend text,
  location text,
  eligibility text,
  job_description text not null,
  selection_process text,
  gd_applicable boolean not null default false,
  deadline timestamptz,
  status public.role_status not null default 'draft',
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.recruiter_role_assignments (
  recruiter_id uuid not null references public.recruiters(id) on delete cascade,
  role_id uuid not null references public.internship_roles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (recruiter_id, role_id)
);

create table public.resumes (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text not null default 'application/pdf',
  file_size_bytes integer not null,
  status public.resume_status not null default 'pending',
  verification_note text,
  verified_by uuid references public.profiles(id),
  verified_at timestamptz,
  uploaded_at timestamptz not null default now(),
  constraint resumes_pdf_only check (mime_type = 'application/pdf'),
  constraint resumes_max_5mb check (file_size_bytes > 0 and file_size_bytes <= 5242880)
);

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students(id) on delete cascade,
  role_id uuid not null references public.internship_roles(id) on delete cascade,
  resume_id uuid not null references public.resumes(id),
  resume_shortlist_status public.application_status not null default 'pending',
  test_status public.application_status not null default 'pending',
  gd_status public.application_status not null default 'not_applicable',
  offer_status public.application_status not null default 'pending',
  applied_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (student_id, role_id)
);

create table public.status_history (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  changed_by uuid references public.profiles(id),
  field_name text not null,
  old_status public.application_status,
  new_status public.application_status not null,
  changed_at timestamptz not null default now()
);

create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_touch_updated_at
before update on public.profiles
for each row execute function public.touch_updated_at();

create trigger internship_roles_touch_updated_at
before update on public.internship_roles
for each row execute function public.touch_updated_at();

create trigger applications_touch_updated_at
before update on public.applications
for each row execute function public.touch_updated_at();

create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active = true;
$$;

create or replace function public.is_organizer()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.current_role() = 'organizer';
$$;

create or replace function public.is_recruiter_for_role(target_role_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.recruiters r
    join public.recruiter_role_assignments assignment on assignment.recruiter_id = r.id
    where r.profile_id = auth.uid()
      and assignment.role_id = target_role_id
  );
$$;

create or replace function public.resume_insert_limit()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*)
    from public.resumes
    where student_id = new.student_id
  ) >= 3 then
    raise exception 'Students can upload a maximum of three resumes.';
  end if;

  return new;
end;
$$;

create trigger resumes_insert_limit
before insert on public.resumes
for each row execute function public.resume_insert_limit();

create or replace function public.validate_application_resume()
returns trigger
language plpgsql
as $$
declare
  resume_record public.resumes;
  role_record public.internship_roles;
begin
  select * into resume_record
  from public.resumes
  where id = new.resume_id;

  if resume_record.id is null then
    raise exception 'Resume does not exist.';
  end if;

  if resume_record.student_id <> new.student_id then
    raise exception 'Resume does not belong to this student.';
  end if;

  if resume_record.status <> 'verified' then
    raise exception 'Only verified resumes can be used for applications.';
  end if;

  select * into role_record
  from public.internship_roles
  where id = new.role_id;

  if role_record.status <> 'open' then
    raise exception 'Applications are only allowed for open roles.';
  end if;

  if role_record.deadline is not null and role_record.deadline < now() then
    raise exception 'Application deadline has passed.';
  end if;

  if TG_OP = 'INSERT' then
    new.resume_shortlist_status = 'pending';
    new.test_status = 'pending';
    new.offer_status = 'pending';
  end if;

  if role_record.gd_applicable = false then
    new.gd_status = 'not_applicable';
  elsif TG_OP = 'INSERT' then
    new.gd_status = 'pending';
  end if;

  return new;
end;
$$;

create trigger applications_validate_resume
before insert or update of resume_id, role_id, student_id on public.applications
for each row execute function public.validate_application_resume();

create or replace function public.prevent_application_identity_update()
returns trigger
language plpgsql
as $$
begin
  if old.student_id <> new.student_id
    or old.role_id <> new.role_id
    or old.resume_id <> new.resume_id then
    raise exception 'Application student, role, and resume cannot be changed after submission.';
  end if;

  return new;
end;
$$;

create trigger applications_prevent_identity_update
before update on public.applications
for each row execute function public.prevent_application_identity_update();

alter table public.profiles enable row level security;
alter table public.students enable row level security;
alter table public.companies enable row level security;
alter table public.recruiters enable row level security;
alter table public.internship_roles enable row level security;
alter table public.recruiter_role_assignments enable row level security;
alter table public.resumes enable row level security;
alter table public.applications enable row level security;
alter table public.status_history enable row level security;

create policy "profiles_self_or_organizer_select"
on public.profiles for select
using (id = auth.uid() or public.is_organizer());

create policy "profiles_organizer_manage"
on public.profiles for all
using (public.is_organizer())
with check (public.is_organizer());

create policy "students_self_or_organizer_select"
on public.students for select
using (profile_id = auth.uid() or public.is_organizer());

create policy "students_recruiter_applicant_select"
on public.students for select
using (
  exists (
    select 1
    from public.applications a
    where a.student_id = students.id
      and public.is_recruiter_for_role(a.role_id)
  )
);

create policy "students_organizer_manage"
on public.students for all
using (public.is_organizer())
with check (public.is_organizer());

create policy "companies_visible_to_authenticated"
on public.companies for select
using (auth.uid() is not null);

create policy "companies_organizer_manage"
on public.companies for all
using (public.is_organizer())
with check (public.is_organizer());

create policy "recruiters_self_or_organizer_select"
on public.recruiters for select
using (profile_id = auth.uid() or public.is_organizer());

create policy "recruiters_organizer_manage"
on public.recruiters for all
using (public.is_organizer())
with check (public.is_organizer());

create policy "internship_roles_visible_open"
on public.internship_roles for select
using (
  status = 'open'
  or public.is_organizer()
  or public.is_recruiter_for_role(id)
);

create policy "internship_roles_organizer_manage"
on public.internship_roles for all
using (public.is_organizer())
with check (public.is_organizer());

create policy "assignments_recruiter_or_organizer_select"
on public.recruiter_role_assignments for select
using (
  public.is_organizer()
  or exists (
    select 1
    from public.recruiters r
    where r.id = recruiter_role_assignments.recruiter_id
      and r.profile_id = auth.uid()
  )
);

create policy "assignments_organizer_manage"
on public.recruiter_role_assignments for all
using (public.is_organizer())
with check (public.is_organizer());

create policy "resumes_student_own_select"
on public.resumes for select
using (
  public.is_organizer()
  or exists (
    select 1
    from public.students s
    where s.id = resumes.student_id
      and s.profile_id = auth.uid()
  )
  or exists (
    select 1
    from public.applications a
    where a.resume_id = resumes.id
      and public.is_recruiter_for_role(a.role_id)
  )
);

create policy "resumes_student_insert"
on public.resumes for insert
with check (
  exists (
    select 1
    from public.students s
    where s.id = resumes.student_id
      and s.profile_id = auth.uid()
  )
);

create policy "resumes_student_update_pending"
on public.resumes for update
using (
  exists (
    select 1
    from public.students s
    where s.id = resumes.student_id
      and s.profile_id = auth.uid()
  )
  and status = 'pending'
)
with check (
  exists (
    select 1
    from public.students s
    where s.id = resumes.student_id
      and s.profile_id = auth.uid()
  )
  and status = 'pending'
  and verified_by is null
  and verified_at is null
);

create policy "resumes_organizer_manage"
on public.resumes for all
using (public.is_organizer())
with check (public.is_organizer());

create policy "applications_student_select"
on public.applications for select
using (
  public.is_organizer()
  or public.is_recruiter_for_role(role_id)
  or exists (
    select 1
    from public.students s
    where s.id = applications.student_id
      and s.profile_id = auth.uid()
  )
);

create policy "applications_student_insert"
on public.applications for insert
with check (
  exists (
    select 1
    from public.students s
    where s.id = applications.student_id
      and s.profile_id = auth.uid()
  )
);

create policy "applications_recruiter_or_organizer_update"
on public.applications for update
using (public.is_organizer() or public.is_recruiter_for_role(role_id))
with check (public.is_organizer() or public.is_recruiter_for_role(role_id));

create policy "status_history_visible_by_scope"
on public.status_history for select
using (
  public.is_organizer()
  or exists (
    select 1
    from public.applications a
    join public.students s on s.id = a.student_id
    where a.id = status_history.application_id
      and (s.profile_id = auth.uid() or public.is_recruiter_for_role(a.role_id))
  )
);

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
