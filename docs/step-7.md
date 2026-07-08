# Step 7 Production Readiness Notes

## What Step 7 Adds

- Vercel-production Supabase public environment validation.
- Local setup checker script.
- GitHub Actions CI workflow.
- README with project overview and scripts.
- Deployment guide.
- Manual QA checklist.

## Scripts

- `npm.cmd run check:setup`
  - Checks required project files.
  - Confirms student seed has 78 rows.
  - Warns if `.env.local` or Supabase env values are missing.

## Production Behavior

Local development and CI can still preview/build the UI without real Supabase env values. Vercel production runtime, or any environment setting `REQUIRE_SUPABASE_ENV=true`, now requires:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Provisioning scripts still require:

- `SUPABASE_SERVICE_ROLE_KEY`

## CI

GitHub Actions runs:

- `npm ci`
- `npm run check:setup`
- `npm run typecheck`
- `npm run lint`
- `npm run build`

The included CI build uses placeholder public Supabase values. Real Vercel deployments should use the actual project URL and anon key.