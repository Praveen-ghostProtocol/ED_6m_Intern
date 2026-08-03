-- Allow company accounts to attach newly created roles to their own recruiter record.
-- This keeps organizer assignment rights intact while allowing recruiter portal role creation to complete.

grant select, insert on public.recruiter_role_assignments to authenticated;

drop policy if exists "assignments_recruiter_self_company_insert" on public.recruiter_role_assignments;
create policy "assignments_recruiter_self_company_insert"
on public.recruiter_role_assignments for insert
with check (
  public.is_organizer()
  or exists (
    select 1
    from public.recruiters r
    join public.internship_roles ir on ir.id = recruiter_role_assignments.role_id
    where r.id = recruiter_role_assignments.recruiter_id
      and r.profile_id = auth.uid()
      and r.company_id = ir.company_id
  )
);