# SolarService

Frontend MVP for SolarService, a solar equipment shop and home installation service.

## Run locally

```bash
npm install
npm run dev
```

Create a production build with `npm run build`.

## Supabase Auth

Copy `.env.example` to `.env.local` and set the Supabase project URL and **Publishable** key:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_your_key
```

Restart the Vite server after changing environment variables. In Supabase, configure
Authentication → URL Configuration with the local development URL (`http://localhost:5173`)
and the deployed site URL in the redirect URL allowlist. Email confirmation behavior is
controlled by the Supabase Auth settings.

Never put a Supabase `secret` or `service_role` key in a `VITE_` variable or browser code.
`.env.local` is ignored by Git; only `.env.example` should be committed.

The current integration implements email/password sign-up, sign-in, sign-out, session
restoration, and password recovery. Application tables and role-based Row Level Security are
defined in `supabase/migrations/20261031200000_initial_schema.sql`.

To create the tables, open the Supabase project → **SQL Editor**, paste the migration file's
contents, and run it. The migration creates profiles, products, packages, orders, bookings,
technician assignments, surveys and images, quotations, installations, payments, and reviews.
It also configures RLS policies and RPCs for creating price-calculated orders and responding
to quotations. The Frontend still needs to be connected to these tables.

New accounts receive the `customer` role. To grant the initial administrator role, first
register that account, then run this once in the Supabase SQL Editor, replacing the email:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@example.com');
```

Role changes should only be made by a trusted administrator in the SQL Editor. Do not expose
service-role credentials in the browser. Payment gateway processing and automated stock
reservation are not included.
