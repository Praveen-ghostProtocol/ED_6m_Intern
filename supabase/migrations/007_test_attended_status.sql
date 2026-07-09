-- Track whether a student attended the test separately from test shortlist status.

alter table public.applications
  add column if not exists test_attended boolean;