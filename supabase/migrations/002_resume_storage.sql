insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('resumes', 'resumes', false, 5242880, array['application/pdf'])
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "resume_objects_student_insert"
on storage.objects for insert
with check (
  bucket_id = 'resumes'
  and exists (
    select 1
    from public.students s
    where s.profile_id = auth.uid()
      and s.id = ((storage.foldername(name))[1])::uuid
  )
);

create policy "resume_objects_authorized_select"
on storage.objects for select
using (
  bucket_id = 'resumes'
  and exists (
    select 1
    from public.resumes r
    left join public.students s on s.id = r.student_id
    where r.storage_path = storage.objects.name
      and (
        s.profile_id = auth.uid()
        or public.is_organizer()
        or exists (
          select 1
          from public.applications a
          where a.resume_id = r.id
            and public.is_recruiter_for_role(a.role_id)
        )
      )
  )
);

create policy "resume_objects_student_delete_pending"
on storage.objects for delete
using (
  bucket_id = 'resumes'
  and exists (
    select 1
    from public.resumes r
    join public.students s on s.id = r.student_id
    where r.storage_path = storage.objects.name
      and s.profile_id = auth.uid()
      and r.status = 'pending'
  )
);