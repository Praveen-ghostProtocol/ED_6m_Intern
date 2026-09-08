create or replace function public.current_student_application_locked()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.students s
    where s.id = public.current_student_id()
      and lower(s.roll_number) in ('ed23b074')
  )
  or exists (
    select 1
    from public.applications a
    where a.student_id = public.current_student_id()
      and a.offer_status = 'offer_given'
  );
$$;

grant execute on function public.current_student_application_locked() to authenticated;
grant execute on function public.current_student_application_locked() to service_role;

drop policy if exists "applications_student_insert" on public.applications;
create policy "applications_student_insert"
on public.applications for insert
with check (
  student_id = public.current_student_id()
  and public.current_student_application_locked() = false
);

drop policy if exists "applications_student_update_resume_before_deadline" on public.applications;
create policy "applications_student_update_resume_before_deadline"
on public.applications for update
using (
  public.current_student_application_locked() = false
  and exists (
    select 1
    from public.students s
    join public.internship_roles ir on ir.id = applications.role_id
    where s.id = applications.student_id
      and s.profile_id = auth.uid()
      and (ir.deadline is null or ir.deadline >= now())
  )
)
with check (
  public.current_student_application_locked() = false
  and exists (
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
  public.current_student_application_locked() = false
  and exists (
    select 1
    from public.students s
    join public.internship_roles ir on ir.id = applications.role_id
    where s.id = applications.student_id
      and s.profile_id = auth.uid()
      and (ir.deadline is null or ir.deadline >= now())
  )
);

create or replace function public.validate_application_resume()
returns trigger
language plpgsql
as $$
declare
  resume_record public.resumes;
  role_record public.internship_roles;
  student_application_locked boolean;
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

  if TG_OP = 'INSERT' or old.resume_id is distinct from new.resume_id then
    select exists (
      select 1
      from public.students s
      where s.id = new.student_id
        and lower(s.roll_number) in ('ed23b074')
    )
    or exists (
      select 1
      from public.applications a
      where a.student_id = new.student_id
        and a.offer_status = 'offer_given'
    ) into student_application_locked;

    if student_application_locked then
      raise exception 'Application access is closed for this student.';
    end if;
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

create or replace function public.prevent_application_identity_update()
returns trigger
language plpgsql
as $$
declare
  role_deadline timestamptz;
  is_student_owner boolean;
  status_changed boolean;
  resume_changed boolean;
  student_application_locked boolean;
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

    select exists (
      select 1
      from public.students s
      where s.id = old.student_id
        and lower(s.roll_number) in ('ed23b074')
    )
    or exists (
      select 1
      from public.applications a
      where a.student_id = old.student_id
        and a.offer_status = 'offer_given'
    ) into student_application_locked;

    if student_application_locked then
      raise exception 'Application access is closed for this student.';
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
