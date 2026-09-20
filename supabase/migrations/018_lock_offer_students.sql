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
      and lower(s.roll_number) in (
        'ed23b001',
        'ed23b002',
        'ed23b004',
        'ed23b007',
        'ed23b008',
        'ed23b009',
        'ed23b010',
        'ed23b012',
        'ed23b013',
        'ed23b015',
        'ed23b016',
        'ed23b023',
        'ed23b027',
        'ed23b028',
        'ed23b034',
        'ed23b041',
        'ed23b042',
        'ed23b044',
        'ed23b047',
        'ed23b049',
        'ed23b050',
        'ed23b054',
        'ed23b056',
        'ed23b060',
        'ed23b061',
        'ed23b063',
        'ed23b065',
        'ed23b067',
        'ed23b068',
        'ed23b070',
        'ed23b071',
        'ed23b073',
        'ed23b074',
        'ed23b081'
      )
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
