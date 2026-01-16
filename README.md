# One Product Store

Production-ready, two-page eCommerce storefront with a protected admin console, Supabase backend, Stripe-ready payments, and automated email notifications.

## Features
- Angular standalone components with strict typing and signals.
- Supabase Auth for admin access + PostgreSQL schema with RLS.
- Stripe-ready payment flow with edge functions.
- Configurable gateway + email settings in Admin Dashboard.
- Automated receipt + admin notification emails.
- Responsive UI with reusable components and loading skeletons.

## Tech stack
- Angular 21 (standalone APIs)
- Supabase (Postgres, Auth, Storage, Edge Functions)
- Stripe Checkout (Edge Functions + Stripe JS)
- SMTP email delivery

## Project structure
- `src/app/core`: API + services, state stores, guards, models
- `src/app/features/public`: Product, Checkout, Payment Success/Failure
- `src/app/features/admin`: Login, Orders, Settings
- `supabase/migrations`: SQL schema + RLS
- `supabase/functions`: Edge functions (payments + email + admin config)

## Local setup
1. Install dependencies:
   - `npm install`

2. Configure environments:
   - Update `src/environments/environment.development.ts` and `src/environments/environment.ts` with your Supabase URL and anon key.

3. Set up Supabase schema:
   - Apply `supabase/migrations/001_init.sql`.
   - Seed optional data with `supabase/seed/seed.sql`.

4. Create an admin user:
   - Create a user in Supabase Auth.
   - Insert their user ID into `public.admin_users`.

5. Configure Storage:
   - Create a `product-images` bucket.
   - Set a public read policy or signed URL flow for image access.

6. Edge function environment variables:
   - `SUPABASE_URL`
   - `SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `STRIPE_SECRET_KEY`
   - `STRIPE_WEBHOOK_SECRET`
   - `SMTP_HOST`
   - `SMTP_PORT`
   - `SMTP_USER`
   - `SMTP_PASS`
   - `SMTP_FROM`
   - `ADMIN_NOTIFICATION_EMAIL`

7. Run locally:
   - `npm run start`

## Supabase edge functions
- `create-payment-session`: creates a Stripe Checkout session and stores payment metadata.
- `confirm-payment`: verifies a checkout session, updates order/payment status, triggers emails.
- `payment-webhook`: Stripe webhook handler (checkout completion).
- `send-email`: SMTP email delivery with HTML template rendering.
- `admin-update-settings`: secure settings update for admins only.

## Testing
- Unit tests: `npm run test`
- E2E tests: `npm run test:e2e`

## Notes
- `environment.development.ts` enables mock data to support local UI without Supabase.
- `app_settings_public` is kept in sync automatically for safe public settings reads.
- Secrets are never stored or exposed on the public pages.
