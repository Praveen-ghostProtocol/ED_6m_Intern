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

    if old.status not in ('pending', 'rejected') then
      raise exception 'Approved master resume entries cannot be edited.';
    end if;

    if new.student_id <> old.student_id
      or new.status <> 'pending'
      or new.verification_note is not null
      or new.verified_by is not null
      or new.verified_at is not null then
      raise exception 'Master resume entries can only be edited and sent back for verification.';
    end if;
  end if;

  return new;
end;
$$;

drop policy if exists "master_resume_entries_student_update_rejected" on public.master_resume_entries;
drop policy if exists "master_resume_entries_student_update_pending_or_rejected" on public.master_resume_entries;
create policy "master_resume_entries_student_update_pending_or_rejected"
on public.master_resume_entries for update
using (student_id = public.current_student_id() and status in ('pending', 'rejected'))
with check (student_id = public.current_student_id() and status = 'pending');
