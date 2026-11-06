# Nail Studio: Base Project (Next.js + Supabase)

Premium manicure/pedicure studio site for the US market (English, USD, `America/New_York` by default).

## 1. Install (VS Code)
```bash
npm install
cp .env.example .env.local     # then fill in your Supabase values
npm run dev                    # http://localhost:3000
npm run test                   # unit tests
npm run typecheck
```

## 2. Configure Supabase
1. Create a project at supabase.com.
2. SQL Editor: run, in order, `supabase/migrations/0001_schema.sql`, `0002_rls.sql`, `0003_defaults.sql`.
3. Project Settings > API: copy the URL and anon key into `.env.local`.
   Copy the **service_role** key into `SUPABASE_SERVICE_ROLE_KEY` (server only, never `NEXT_PUBLIC_`).
4. Authentication > Providers: keep Email on and **disable "Allow new users to sign up"** (no public registration).
5. Authentication > URL Configuration: add `http://localhost:3000` and your production URL.

## 3. Create the first admin (securely)
1. Dashboard > Authentication > Users > **Add user** (email + strong password).
2. SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'you@yourdomain.com';
   ```
Roles can't be set from the client: a trigger blocks role changes unless done by an admin or from the SQL editor.

## 4. Architecture
- `src/app` routes. `src/components` UI split by area. `src/actions` Server Actions. `src/lib` Supabase clients, validation (Zod), security helpers.
- Three Supabase clients: `client.ts` (browser, anon + RLS), `server.ts` (session cookies + RLS), `admin.ts` (service role, `server-only`).
- Public bookings call the SQL function `create_booking()` (service role only). It re-validates services, hours, breaks, blocked dates, notice window, and relies on a PostgreSQL **exclusion constraint** so two people can never book overlapping slots, even simultaneously.
- RLS is enabled on every table; anon has no access to bookings, customers or audit logs.

## 5. Security checklist already in place
RLS default-deny, role-escalation trigger, append-only audit log, Zod validation, honeypot + rate limit, hashed one-time cancel token, security headers, `server-only` guard on the service key, safe error messages, storage bucket limited to images/5 MB/admin writes.
Note: the in-memory rate limiter must be swapped for a shared store (e.g. Upstash) in production.

## 6. Roadmap (next modules)
1. Booking flow (`/book`): availability endpoint, calendar, slot picker, success screen.
2. Auth pages (`/login`, password reset) and admin layout.
3. Admin: bookings, services, artists, clients, settings, stats.
4. Home sections: features, about + artists, reviews, contact/map. Privacy and Terms pages.
5. Email confirmations and cancel link (Resend), later WhatsApp Business. Set keys in `.env.local`.
6. Audit-log writes, image upload with magic-byte check, integration tests.

## 7. US legal notes (confirm with a lawyer)
Privacy policy covering state laws such as CCPA/CPRA (California); explicit opt-in consent before sending SMS/WhatsApp (TCPA); never store card data (use Stripe if you add payments).

---
# v2 additions
- **Run `supabase/migrations/0004_extras.sql`** after 0001-0003 (adds Spanish fields, WhatsApp, gallery, default artist).
- Public site is bilingual (EN/ES). Language follows the visitor's browser the first time; the toggle in the header remembers the choice.
- `/book`: real booking flow (server-side availability + DB-enforced no double booking).
- `/login` and `/admin`: bookings, services (create/edit/replace image/delete), gallery, reviews moderation, settings (hours, WhatsApp, hero image).
- Admin accounts: create the user in Supabase, then promote with SQL (see section 3). Public signups stay disabled.
- Still pending: confirmation emails + one-time cancel link, password reset page, rescheduling from the admin, customers page, charts.
