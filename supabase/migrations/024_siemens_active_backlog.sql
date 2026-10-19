alter table public.applications
  add column if not exists active_backlog boolean;

comment on column public.applications.active_backlog is
  'Whether the candidate had an active backlog when applying to a Siemens Healthineers role.';

create or replace function public.validate_siemens_active_backlog()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  is_siemens_role boolean;
begin
  select lower(trim(c.name)) = 'siemens healthineers'
  into is_siemens_role
  from public.internship_roles ir
  join public.companies c on c.id = ir.company_id
  where ir.id = new.role_id;

  if coalesce(is_siemens_role, false) then
    if new.active_backlog is null then
      raise exception 'Select whether the candidate has an active backlog.';
    end if;
  else
    new.active_backlog = null;
  end if;

  return new;
end;
$$;

drop trigger if exists validate_siemens_active_backlog on public.applications;
create trigger validate_siemens_active_backlog
before insert or update of role_id, resume_id, active_backlog on public.applications
for each row execute function public.validate_siemens_active_backlog();
