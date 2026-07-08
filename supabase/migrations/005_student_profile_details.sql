alter table public.students
  add column if not exists alternate_phone text,
  add column if not exists alternate_email text,
  add column if not exists date_of_birth date,
  add column if not exists gender text,
  add column if not exists current_address_pincode text,
  add column if not exists current_address text,
  add column if not exists permanent_address_pincode text,
  add column if not exists permanent_address text,
  add column if not exists branch_specialisation text,
  add column if not exists profile_completed_at timestamptz;

grant update (full_name) on public.profiles to authenticated;

grant update (
  cgpa,
  phone,
  alternate_phone,
  alternate_email,
  date_of_birth,
  gender,
  current_address_pincode,
  current_address,
  permanent_address_pincode,
  permanent_address,
  branch_specialisation,
  profile_completed_at
) on public.students to authenticated;

drop policy if exists "students_self_update_profile" on public.students;
create policy "students_self_update_profile"
on public.students for update
using (profile_id = auth.uid())
with check (profile_id = auth.uid());