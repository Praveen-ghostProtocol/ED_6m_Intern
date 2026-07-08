-- Grants needed when the project disables automatic table exposure.
-- The service role still bypasses RLS, but it also needs SQL privileges for REST access.

grant usage on schema public to service_role;
grant usage on type public.app_role to service_role;
grant usage on type public.resume_status to service_role;
grant usage on type public.role_status to service_role;
grant usage on type public.application_status to service_role;

grant all privileges on public.profiles to service_role;
grant all privileges on public.students to service_role;
grant all privileges on public.companies to service_role;
grant all privileges on public.recruiters to service_role;
grant all privileges on public.internship_roles to service_role;
grant all privileges on public.recruiter_role_assignments to service_role;
grant all privileges on public.resumes to service_role;
grant all privileges on public.applications to service_role;
grant all privileges on public.status_history to service_role;

grant execute on function public.current_role() to service_role;
grant execute on function public.is_organizer() to service_role;
grant execute on function public.is_recruiter_for_role(uuid) to service_role;
grant execute on function public.current_student_id() to service_role;
grant execute on function public.is_recruiter_for_student(uuid) to service_role;
grant execute on function public.is_recruiter_for_resume(uuid) to service_role;
grant execute on function public.can_access_application(uuid) to service_role;
grant execute on function public.can_access_resume_path(text) to service_role;
grant execute on function public.can_delete_resume_path(text) to service_role;