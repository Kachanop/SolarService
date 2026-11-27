# Backend

Supabase provides PostgreSQL, authentication, row-level security, and database
functions. The Express service in `server.js` creates Stripe PromptPay payments
for orders and handles Stripe payment webhooks.

Database schema and policy migrations are in `supabase/migrations/`. Apply them
to the Supabase project using the SQL Editor as described in the root
[`README.md`](../README.md).

The technician survey and handoff workflow is added by
`20261115000000_technician_workflows.sql`. Apply it after the existing
migrations. It extends `technician_assignments`, `site_surveys`,
`service_bookings`, and the existing `installations` table, which remains the
canonical installation record. It adds installation image and notification
tables, creates private Storage buckets, and installs the RLS policies and checked RPCs
used by the frontend. Do not treat the workflow as live until Supabase confirms
this migration ran successfully.

Copy `.env.example` to `.env` and set the Supabase URL, Supabase service-role
key, Stripe secret key, and webhook signing secret. Never expose these server
secrets in frontend environment variables. The API confirms PromptPay intents
server-side and returns the Stripe-hosted QR image URL to the React client.
Installment reminders are scheduled by the Cloudflare Worker every five
minutes, sent by Resend three days before and on each due date, and retried
with backoff when delivery fails. Configure `RESEND_API_KEY`, a verified
`EMAIL_FROM` address, and `FRONTEND_ORIGIN`; apply
`20261128030000_installment_reminder_workflow.sql` before deploying the Worker.
Products published in the admin catalog appear in the storefront with their
admin-managed images. Checkout stores a price/name snapshot on the order; the
QR response includes those order items and validates that their total matches
the amount charged.
Start the API from the repository root with `npm run dev:backend`; start the
Vite frontend separately with `npm run dev`.
