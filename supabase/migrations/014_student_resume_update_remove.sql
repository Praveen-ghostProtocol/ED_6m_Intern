alter table public.resumes
add column if not exists removed_at timestamptz;

create or replace function public.resume_insert_limit()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if (
    select count(*)
    from public.resumes
    where student_id = new.student_id
      and removed_at is null
  ) >= 3 then
    raise exception 'Students can upload a maximum of three resumes.';
  end if;

  return new;
end;
$$;

create or replace function public.remove_student_resume(target_resume_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.resumes
  set removed_at = now()
  where id = target_resume_id
    and student_id = public.current_student_id()
    and status in ('pending', 'rejected')
    and removed_at is null;

  if not found then
    raise exception 'Only pending or rejected resumes can be removed.';
  end if;
end;
$$;

create or replace function public.replace_student_resume(
  target_resume_id uuid,
  new_file_name text,
  new_storage_path text,
  new_file_size_bytes integer
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  target_student_id uuid;
  active_resume_count integer;
  new_resume_id uuid;
begin
  if length(trim(coalesce(new_file_name, ''))) = 0 then
    raise exception 'Resume file name is required.';
  end if;

  if length(trim(coalesce(new_storage_path, ''))) = 0 then
    raise exception 'Resume storage path is required.';
  end if;

  if new_file_size_bytes <= 0 or new_file_size_bytes > 5242880 then
    raise exception 'Resume size must be 5 MB or less.';
  end if;

  select student_id into target_student_id
  from public.resumes
  where id = target_resume_id
    and student_id = public.current_student_id()
    and status in ('pending', 'rejected')
    and removed_at is null
  for update;

  if target_student_id is null then
    raise exception 'Only pending or rejected resumes can be updated.';
  end if;

  select count(*) into active_resume_count
  from public.resumes
  where student_id = target_student_id
    and removed_at is null
    and id <> target_resume_id;

  if active_resume_count >= 3 then
    raise exception 'Students can upload a maximum of three resumes.';
  end if;

  update public.resumes
  set removed_at = now()
  where id = target_resume_id;

  insert into public.resumes (
    student_id,
    file_name,
    storage_path,
    mime_type,
    file_size_bytes,
    status,
    verification_note,
    verified_by,
    verified_at
  ) values (
    target_student_id,
    new_file_name,
    new_storage_path,
    'application/pdf',
    new_file_size_bytes,
    'pending',
    null,
    null,
    null
  ) returning id into new_resume_id;

  return new_resume_id;
end;
$$;

grant execute on function public.remove_student_resume(uuid) to authenticated;
grant execute on function public.replace_student_resume(uuid, text, text, integer) to authenticated;
