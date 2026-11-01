# Backend

This project uses Supabase as its backend-as-a-service; it does not have a
separate Node.js or Express API server. Supabase provides PostgreSQL,
authentication, row-level security, and database functions.

Database schema and policy migrations are in `supabase/migrations/`. Apply them
to the Supabase project using the SQL Editor as described in the root
[`README.md`](../README.md).
