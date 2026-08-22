-- Keep published role/JD visibility after deadlines while draft roles remain hidden from students.

drop policy if exists "internship_roles_visible_open" on public.internship_roles;
create policy "internship_roles_visible_published"
on public.internship_roles for select
using (
  status in ('open', 'closed')
  or public.is_organizer()
  or public.is_recruiter_for_role(id)
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
        or (auth.uid() is not null and ir.status in ('open', 'closed'))
        or exists (
          select 1
          from public.recruiters r
          where r.profile_id = auth.uid()
            and r.company_id = ir.company_id
        )
      )
  )
);
