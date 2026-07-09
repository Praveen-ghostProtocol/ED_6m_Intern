-- Job description PDF support, company role creation, and student application edits.

alter table public.internship_roles
  add column if not exists jd_file_name text,
  add column if not exists jd_storage_path text unique,
  add column if not exists jd_file_size_bytes integer;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('job-descriptions', 'job-descriptions', false, 10485760, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

grant select, insert, update, delete on public.applications to authenticated;
grant select, insert, update on public.internship_roles to authenticated;

drop policy if exists "internship_roles_company_select" on public.internship_roles;
create policy "internship_roles_company_select"
on public.internship_roles for select
using (
  exists (
    select 1
    from public.recruiters r
    where r.profile_id = auth.uid()
      and r.company_id = internship_roles.company_id
  )
);
drop policy if exists "internship_roles_company_insert" on public.internship_roles;
create policy "internship_roles_company_insert"
on public.internship_roles for insert
with check (
  public.is_organizer()
  or exists (
    select 1
    from public.recruiters r
    where r.profile_id = auth.uid()
      and r.company_id = internship_roles.company_id
  )
);

drop policy if exists "internship_roles_company_update" on public.internship_roles;
create policy "internship_roles_company_update"
on public.internship_roles for update
using (
  public.is_organizer()
  or exists (
    select 1
    from public.recruiters r
    where r.profile_id = auth.uid()
      and r.company_id = internship_roles.company_id
  )
)
with check (
  public.is_organizer()
  or exists (
    select 1
    from public.recruiters r
    where r.profile_id = auth.uid()
      and r.company_id = internship_roles.company_id
  )
);

drop policy if exists "applications_student_update_resume_before_deadline" on public.applications;
create policy "applications_student_update_resume_before_deadline"
on public.applications for update
using (
  exists (
    select 1
    from public.students s
    join public.internship_roles ir on ir.id = applications.role_id
    where s.id = applications.student_id
      and s.profile_id = auth.uid()
      and (ir.deadline is null or ir.deadline >= now())
  )
)
with check (
  exists (
    select 1
    from public.students s
    join public.internship_roles ir on ir.id = applications.role_id
    where s.id = applications.student_id
      and s.profile_id = auth.uid()
      and (ir.deadline is null or ir.deadline >= now())
  )
);

drop policy if exists "applications_student_delete_before_deadline" on public.applications;
create policy "applications_student_delete_before_deadline"
on public.applications for delete
using (
  exists (
    select 1
    from public.students s
    join public.internship_roles ir on ir.id = applications.role_id
    where s.id = applications.student_id
      and s.profile_id = auth.uid()
      and (ir.deadline is null or ir.deadline >= now())
  )
);

create or replace function public.prevent_application_identity_update()
returns trigger
language plpgsql
as $$
declare
  role_deadline timestamptz;
  is_student_owner boolean;
  status_changed boolean;
  resume_changed boolean;
begin
  if old.student_id <> new.student_id or old.role_id <> new.role_id then
    raise exception 'Application student and role cannot be changed after submission.';
  end if;

  status_changed := old.resume_shortlist_status is distinct from new.resume_shortlist_status
    or old.test_status is distinct from new.test_status
    or old.gd_status is distinct from new.gd_status
    or old.offer_status is distinct from new.offer_status;

  resume_changed := old.resume_id is distinct from new.resume_id;

  select exists (
    select 1
    from public.students s
    where s.id = old.student_id
      and s.profile_id = auth.uid()
  ) into is_student_owner;

  if status_changed and is_student_owner and not public.is_organizer() and not public.is_recruiter_for_role(old.role_id) then
    raise exception 'Students cannot update application statuses.';
  end if;

  if resume_changed then
    if not is_student_owner then
      raise exception 'Only the applicant can update the submitted resume.';
    end if;

    if status_changed then
      raise exception 'Resume updates cannot change application statuses.';
    end if;

    select deadline into role_deadline
    from public.internship_roles
    where id = old.role_id;

    if role_deadline is not null and role_deadline < now() then
      raise exception 'Application deadline has passed.';
    end if;
  end if;

  return new;
end;
$$;

drop policy if exists "job_description_objects_authorized_insert" on storage.objects;
create policy "job_description_objects_authorized_insert"
on storage.objects for insert
with check (
  bucket_id = 'job-descriptions'
  and (
    public.is_organizer()
    or exists (
      select 1
      from public.recruiters r
      where r.profile_id = auth.uid()
        and r.company_id = ((storage.foldername(name))[1])::uuid
    )
  )
);

drop policy if exists "job_description_objects_authorized_select" on storage.objects;
create policy "job_description_objects_authorized_select"
on storage.objects for select
using (
  bucket_id = 'job-descriptions'
  and exists (
    select 1
    from public.internship_roles ir
    where ir.jd_storage_path = storage.objects.name
      and (
        public.is_organizer()
        or (auth.uid() is not null and ir.status = 'open')
        or exists (
          select 1
          from public.recruiters r
          where r.profile_id = auth.uid()
            and r.company_id = ir.company_id
        )
      )
  )
);

drop policy if exists "job_description_objects_authorized_update" on storage.objects;
create policy "job_description_objects_authorized_update"
on storage.objects for update
using (
  bucket_id = 'job-descriptions'
  and (
    public.is_organizer()
    or exists (
      select 1
      from public.recruiters r
      where r.profile_id = auth.uid()
        and r.company_id = ((storage.foldername(name))[1])::uuid
    )
  )
)
with check (
  bucket_id = 'job-descriptions'
  and (
    public.is_organizer()
    or exists (
      select 1
      from public.recruiters r
      where r.profile_id = auth.uid()
        and r.company_id = ((storage.foldername(name))[1])::uuid
    )
  )
);

drop policy if exists "job_description_objects_authorized_delete" on storage.objects;
create policy "job_description_objects_authorized_delete"
on storage.objects for delete
using (
  bucket_id = 'job-descriptions'
  and (
    public.is_organizer()
    or exists (
      select 1
      from public.recruiters r
      where r.profile_id = auth.uid()
        and r.company_id = ((storage.foldername(name))[1])::uuid
    )
  )
);