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
