-- Allow company accounts to edit their own company details from the recruiter portal.

grant update (name, description) on public.companies to authenticated;

drop policy if exists "companies_recruiter_self_update" on public.companies;
create policy "companies_recruiter_self_update"
on public.companies for update
using (
  exists (
    select 1
    from public.recruiters r
    where r.profile_id = auth.uid()
      and r.company_id = companies.id
  )
)
with check (
  exists (
    select 1
    from public.recruiters r
    where r.profile_id = auth.uid()
      and r.company_id = companies.id
  )
);