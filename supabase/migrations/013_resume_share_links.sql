create table if not exists public.resume_share_links (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications(id) on delete cascade,
  resume_id uuid not null references public.resumes(id) on delete cascade,
  token text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  last_accessed_at timestamptz,
  unique (application_id, resume_id)
);

alter table public.resume_share_links enable row level security;

grant select, insert, update on public.resume_share_links to authenticated;
grant all privileges on public.resume_share_links to service_role;

drop policy if exists "resume_share_links_organizer_manage" on public.resume_share_links;
create policy "resume_share_links_organizer_manage"
on public.resume_share_links
for all
using (public.is_organizer())
with check (public.is_organizer());