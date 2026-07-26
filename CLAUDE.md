@AGENTS.md

# LandscapeLeads — Project Context

## What this is
A two-sided local marketplace connecting landscaping clients with landscapers.
- Clients: sign up for free, request quotes/services.
- Landscapers: sign up, build a profile (services offered, service radius/zip), pay per lead.
- Matching: proximity-based, using landscaper profile data (services + location).

## Business model
- Clients pay nothing.
- Landscapers pay per lead (target: $2.50/lead, likely needs to be sold to
  multiple landscapers per client request — 3-5x — to cover client
  acquisition costs; this number is unvalidated and should be revisited
  once real CAC data exists).
- Revenue lives entirely on the landscaper side — client acquisition cost
  must stay well below what landscaper lead sales bring in.

## Current stage: pre-validation
NOT building the full marketplace yet. Building a lean single-city test first:
1. Client-facing landing page — simple "Get a free quote" form
   (name, zip/address, service needed, phone).
2. Landscaper signup form — profile info (services, zip/radius, phone),
   no login/dashboard yet.
3. Supabase tables for both — no auth complexity yet. Leads matched
   manually (by hand) to landscapers for the first 10-20 leads.
4. Stripe billing NOT wired up yet — hold off until leads have been sold
   manually (by text/call) and landscapers have shown willingness to pay.
5. Only after the manual loop is proven: build automated matching,
   landscaper dashboards/profiles, and self-serve billing.

## Deviation: client accounts shipped ahead of schedule
Per explicit request, clients now have self-serve accounts (Supabase Auth,
email+password) and a dashboard at `/account`:
- Browse landscapers near their zip (same haversine distance logic as the
  admin matching view), see each landscaper's stated contact hours.
- Submit a "service request" to a specific landscaper (`service_requests`
  table) — this is separate from the anonymous `leads` table, which is
  kept as-is for people who don't want to create an account.
- Requests show up in the admin dashboard's "Requests" tab for manual
  follow-up (call/text), same low-tech loop as leads. Optional automatic
  email to the landscaper via Resend if `RESEND_API_KEY` /
  `RESEND_FROM_EMAIL` are set (`lib/notify.js`); silently no-ops if unset
  or if the landscaper has no email on file.
- Landscapers can now optionally create a login too (`/landscaper`),
  separate from the original no-login public signup form at `/landscapers`
  which is unchanged and still the low-friction path for cold outreach.
  `/landscaper/signup` → `/landscaper/complete-profile` (same fields as
  the public form: business info, zip, radius, contact hours, services)
  creates a `landscapers` row with `id = auth.uid()`, mirroring how
  `client_profiles.id = auth.uid()` works. The dashboard at `/landscaper`
  shows client requests sent to them (`service_requests` where
  `landscaper_id = auth.uid()`) with a status dropdown, and an "Edit
  Profile" link back to the same complete-profile form (upsert, so one
  form/action serves both onboarding and later edits).
  Known gap: landscapers who signed up anonymously via the old public
  form have no way to "claim" that existing listing with a new login —
  only brand-new dashboard signups get a linked `landscapers` row. Not
  built (needs a real identity-matching design), flagged here for later.
  Proxy gotcha handled: `/landscaper` (singular, the new authed area) and
  `/landscapers` (plural, the existing public page) look alike —
  `pathname.startsWith('/landscaper')` would wrongly match `/landscapers`
  too, so `proxy.js` checks `=== prefix || startsWith(prefix + '/')`
  instead.
- Phone verification: after completing their profile, clients are prompted
  (skippable, not enforced) to verify their phone via a 6-digit SMS code
  (`/account/verify-phone`, `sendPhoneVerification`/`verifyPhoneCode` in
  `app/account/actions.js`, using Supabase Auth's native phone OTP —
  `auth.updateUser({ phone })` + `verifyOtp({ type: 'phone_change' })`).
  This does nothing until a SMS provider (Twilio) is configured in the
  Supabase dashboard under Authentication > Providers > Phone — until
  then it fails gracefully with a "not set up yet" message. Confirmed via
  logs: fails with `missing Twilio account SID`, not a bug on our end.
  Deliberately not wired up yet (cost + setup deferred per explicit
  request) — no code changes needed once Twilio is added, just Supabase
  dashboard config.

Security note: introducing client self-signup meant "authenticated" in
Postgres RLS no longer safely means "the admin" (clients are authenticated
too). Added `public.admins` (RLS locked down, no policies — only read via
the `security definer` `is_admin()` function) and rewrote the leads
select/update policies to check `is_admin()` instead of blanket
`to authenticated`. Landscapers stays broadly readable to any
authenticated user on purpose (clients need to browse it).

Known constraint: Supabase's free-tier default auth email sending is
rate-limited (hit `429 over_email_send_rate_limit` after ~3 signups in
quick succession while testing). Real client signups needing email
confirmation could hit this under any signup burst. Fix later by adding
custom SMTP (Resend can serve this too) in Supabase Auth settings.

## Nav redesign + staging vs. production visibility
Header nav (`app/components/RoleNav.js`, a client component) replaced the
old four static links (Get a Quote / For Landscapers / Client Login /
Landscaper Login) with: a "You are a: Client|Landscaper" toggle switch,
then just "Login" and "Dashboard" — both links retarget to
`/account/*` or `/landscaper/*` based on the toggle (in-memory React
state, resets on hard refresh, persists across client-side nav). Per
explicit request, "For Landscapers" (the anonymous public signup page)
no longer has a nav link in either environment — the route still works,
just isn't linked from nav. Same for the client quote page in production
(see below). Neither page was removed, only unlinked.

New env var `NEXT_PUBLIC_APP_ENV` ("staging" in `.env.local`,
"production" in `.env.production.local`) controls one thing: whether the
"Get a Quote" nav link shows. In production it's hidden — the `/` quote
page itself is fully functional and un-gated, meant to be reached only
via direct ad links, not site navigation. Verified by building with each
env file and diffing the rendered nav.

## Go-to-market plan
- Launch city/zip: Pflugerville, TX (78660).
- One city, one zip code at a time.
- Landscaper side: cold outreach (calls/walk-ins from Google Maps listings,
  local FB trade groups), NOT paid ads. Offer first 10-20 landscapers free
  leads for month one to solve cold-start with zero CAC.
- Client side: cheap/non-Google channels only —
  Nextdoor (groups + ads), Facebook/Instagram geo-targeted ads,
  Craigslist services postings, referral QR codes on completed jobs.
  Explicitly avoiding Google Ads (cost-prohibitive for this budget/vertical).
- Budget: $100 total starting budget.
  - ~$12/yr domain
  - ~$60-70 client-acquisition ad spend (single zip, tightly targeted)
  - Supabase/Vercel free tiers, Stripe has no monthly fee
  - ~$18 buffer (flyers, QR codes, etc.)

## Key risks / open questions to keep revisiting
- Real cost per client lead (via cheap ad channels) vs. $2.50/landscaper
  price point — math doesn't currently pencil out on a 1:1 lead sale;
  likely needs multi-sell per lead.
- Lead quality vs. lead volume — the standard complaint against
  Thumbtack/Angi/HomeAdvilsor is landscapers pay for leads that don't
  convert. Close rate matters more than volume for retention.
- Cold-start: need supply (landscapers) before demand (clients) will stick,
  and vice versa — solved here by manually seeding landscaper side for free.

## Tech stack (strict)
- Next.js (JavaScript only — NO TypeScript, anywhere)
- React
- Tailwind CSS
- Supabase (DB + eventually auth)
- Stripe (billing — not wired up until manual validation succeeds)
- Vercel (hosting/deploy)
- Expo (for future mobile app, not part of initial web build)

## Project location
All code lives in: `C:\CLAUDE\LandscapingLeads`

## Environments
Two Supabase projects, same org (`efggmcarujwlghremezm`), same schema:
- `landscape-leads` (yaprafaqaywrbjtroutu) — production. Empty of fake
  data; keys saved in `.env.production.local` (gitignored) for use as
  Vercel env vars when deployed.
- `landscape-leads-staging` (uvwflznyvhnkbhwqjucw) — local dev target,
  seeded with fake leads/landscapers around Pflugerville/Round
  Rock/Austin zips for testing the admin matching dashboard.
  `.env.local` (gitignored) points here.
- Each project has its own separate admin (Supabase Auth) account —
  logging into one does not carry over to the other.
- When the schema changes, apply the migration to both projects.

## Developer context
- Full-stack JS developer, comfortable with React/Tailwind/Next.js/Expo/
  Supabase/Stripe.
- Has paid Claude and Supabase subscriptions.
- Prefers small, concrete, shippable first deliverables over building the
  full system upfront.
