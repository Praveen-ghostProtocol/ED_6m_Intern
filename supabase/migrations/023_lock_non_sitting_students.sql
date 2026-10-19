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
        'ed23b003',
        'ed23b004',
        'ed23b005',
        'ed23b006',
        'ed23b007',
        'ed23b008',
        'ed23b009',
        'ed23b010',
        'ed23b012',
        'ed23b013',
        'ed23b014',
        'ed23b015',
        'ed23b016',
        'ed23b018',
        'ed23b023',
        'ed23b025',
        'ed23b026',
        'ed23b027',
        'ed23b028',
        'ed23b032',
        'ed23b034',
        'ed23b035',
        'ed23b036',
        'ed23b037',
        'ed23b038',
        'ed23b039',
        'ed23b040',
        'ed23b041',
        'ed23b042',
        'ed23b043',
        'ed23b044',
        'ed23b045',
        'ed23b046',
        'ed23b047',
        'ed23b048',
        'ed23b049',
        'ed23b050',
        'ed23b051',
        'ed23b052',
        'ed23b053',
        'ed23b054',
        'ed23b056',
        'ed23b057',
        'ed23b060',
        'ed23b061',
        'ed23b062',
        'ed23b063',
        'ed23b064',
        'ed23b065',
        'ed23b067',
        'ed23b068',
        'ed23b070',
        'ed23b071',
        'ed23b072',
        'ed23b073',
        'ed23b074',
        'ed23b079',
        'ed23b080',
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
