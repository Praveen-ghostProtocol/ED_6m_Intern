# Cost Estimate

Assumption: the frontend is pushed to GitHub and hosted on Vercel Hobby/free where allowed by the platform terms.

## Expected monthly cost for this portal

For the Engineering Design internship use case, the likely monthly cost is:

- Development/MVP: USD 0 per month
- Real portal with private resume storage and safer uptime: USD 25 per month
- With a custom domain: add roughly USD 10-20 per year, depending on registrar and domain

The main paid item is the backend provider. Supabase Free can work for a small pilot, but Supabase Pro is the practical recommendation once real student resumes and recruiter access are involved.

## Why Supabase Pro is the likely first paid step

Supabase gives the project:

- PostgreSQL database
- Auth
- Row Level Security policies
- Private resume storage
- Signed resume URLs
- Backups and operational controls

For 78 students, a handful of organizers, and several recruiters, the portal itself is small. The cost pressure is not traffic; it is privacy, reliability, storage, and avoiding free-tier limitations.

## Charges to expect

- GitHub: free for normal repository use.
- Vercel Hobby: free for a student/internal project if usage remains within limits.
- Supabase Free: USD 0, useful for development and testing.
- Supabase Pro: about USD 25/month, recommended for production.
- Domain: optional, usually about USD 10-20/year.
- Email sending: optional. If we add automated email notifications, this may be free at low volume or a small monthly/add-on cost depending on the provider.
- SMS/WhatsApp notifications: optional and paid per message if added later.

## Recommendation

Start development at USD 0/month using Vercel Hobby and Supabase Free.

Before real student resumes are uploaded, move the backend to Supabase Pro or an equivalent paid backend plan. Treat USD 25/month plus a domain as the realistic production budget.
