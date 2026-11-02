# Backend

Supabase provides PostgreSQL, authentication, row-level security, and database
functions. The Express service in `server.js` creates Stripe PromptPay payments
for orders and handles Stripe payment webhooks.

Database schema and policy migrations are in `supabase/migrations/`. Apply them
to the Supabase project using the SQL Editor as described in the root
[`README.md`](../README.md).

Copy `.env.example` to `.env` and set the Supabase URL, Supabase service-role
key, Stripe secret key, and webhook signing secret. Never expose these server
secrets in frontend environment variables. The API confirms PromptPay intents
server-side and returns the Stripe-hosted QR image URL to the React client.
Products published in the admin catalog appear in the storefront with their
admin-managed images. Checkout stores a price/name snapshot on the order; the
QR response includes those order items and validates that their total matches
the amount charged.
Start the API from the repository root with `npm run dev:backend`; start the
Vite frontend separately with `npm run dev`.
