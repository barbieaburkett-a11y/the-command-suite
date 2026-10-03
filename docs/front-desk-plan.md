# Command Front Desk — Phase 0 audit and build plan

Audited source: branch `repair/public-marketing-unification`, commit `eb95e60466274a295d8f0e4a07de1cf31e0ca95d`, plus two fix commits made during this audit. Date: October 2, 2026.

## 1. What this codebase is

| Area | Finding |
| --- | --- |
| Framework | Next.js 16 App Router compiled with `vinext` (Vite) for Cloudflare Workers |
| Hosting | OpenAI Sites (`.openai/hosting.json`, project `appgprj_6a8cc659db988191af4575178c26aef2`), served through Cloudflare |
| Database | Cloudflare D1 (`DB`), 33 numbered SQL migrations, ~120 tables |
| Files | Cloudflare R2 (`FILES`), keys prefixed by workspace id |
| Auth | Better Auth email/password; one primary Company Workspace per user; `contractor_memberships` resolves the workspace server-side |
| Email | Resend for verification and password reset (`app/transactional-email.ts`) |
| Billing | None. `plan_tier` and `bundle_key` are set by an administrator; no Stripe code (only a `stripe_click` analytics counter) |
| Background work | None. No cron, queue, scheduled handler or inbound-email handler exists |
| Tests | 28 Node scripts covering workspace isolation, SQL isolation, pricing/bundle access, route boundaries and modules |
| Build | `pnpm build` passes; `pnpm lint` 0 errors, 44 `<img>` warnings |

## 2. Discrepancies found

1. **The live site is not this code.** thecommandsuite.com still serves the older "partner programs and subcontractor onboarding" homepage. This branch already contains the unified contractor-CRM site (homepage, footer, trial page, pricing, terms), verified on Sept 25 but never published. Publishing this branch fixes most of what the public audit found (mixed product story, old footer text, founder section, image alt text).
2. **robots.txt hid the Command Inbox page from search.** `Disallow: /command` matches `/command-inbox`. Fixed: now `Disallow: /command$` plus `/command/`, in both `app/robots.ts` and `public/robots.txt`.
3. **Duplicated heading text.** "Why we call customers partners" appeared twice in a row on the homepage, trial and pricing pages. Fixed in `app/public-marketing.ts`.
4. **Website leads were never emailed.** The contact/pilot form (`/api/leads`) and checklist form (`/api/guide-leads`) only save to D1, visible at `/command/leads`. Fixed: a `notifyNewLead()` alert is emailed to `LEAD_NOTIFICATION_EMAIL` (falls back to `TRANSACTIONAL_EMAIL_REPLY_TO`) with the lead as reply-to. It never blocks or fails the form. Verified: lead saves with email unconfigured, and saves when sending fails.
5. **For Barbie to decide (not changed):**
   - The Auto-Pilot module is labeled `$1,800/month` (`app/auto-pilot-agent.ts`), which conflicts with the Front Desk pricing ($149 / $399 / $699) and the $79→$99 Suite price.
   - Several public lines mention ChatGPT ("Your crew does not need a ChatGPT account"); consider removing ChatGPT references from customer-facing copy.
   - No visitor analytics. Cloudflare Web Analytics is the simplest fit once hosting is on your own Cloudflare account.

## 3. The hosting decision (needed before Phase 2)

Command Front Desk needs things this app cannot do on OpenAI Sites hosting today: scheduled jobs (hourly checks, weekly reports, posting Reels at a set time), a queue, an inbound email address per customer, and a video renderer.

| Option | What it means | Recommendation |
| --- | --- | --- |
| **A. Move the app to your own Cloudflare account** | Same code, same D1/R2 stack. Unlocks Cron Triggers, Queues, Email Routing (inbound email straight into a Worker) and Containers (for Reel rendering). Requires exporting D1 and R2 from the Sites project and pointing DNS. | **Recommended.** One codebase, one database, lowest monthly cost (Workers Paid starts at about $5/month plus usage). |
| B. Keep the site on Sites; build a separate Front Desk service | A second Worker in your own Cloudflare account with its own database, linked to the website by API. | Works, but two databases and two logins to keep in sync. |
| C. Stay on Sites only | Front Desk would depend on outside cron/webhook services calling the app. | Not recommended; fragile. |

Action for Barbie: create a Cloudflare account (or confirm you have one) and confirm Option A.

## 4. What Front Desk reuses

- Workspaces, memberships, Better Auth sessions and the isolation test harness.
- `workspace_leads` (Module K) as the lead record. Extend it rather than adding a second leads table.
- Command Inbox records for "needs owner" items.
- `transactional-email.ts` for alerts and approved replies.
- `form-guard.ts` rate limiting for the public lead form widget.
- `plan_tier` / `bundle_key` access checks, extended with Front Desk products.

## 5. Data model (migration `0036_front_desk.sql`)

Note: `workspace_leads.status` keeps its Suite values; Front Desk uses the new `front_desk_status` column so no table rebuild is needed. Approval rules are database CHECK constraints.

- `workspace_leads`: add `channel`, `category`, `summary`, `next_step`, `next_step_due`, `last_contact_at`, `source_ref`, `instagram_handle`; widen `status` to `new | reply_ready | waiting_on_them | trial | customer | not_a_fit | converted | archived`.
- `front_desk_settings`: workspace_id, inbound_token (for `leads-<token>@in.thecommandsuite.com`), sender_domain_status, timezone, plan.
- `front_desk_playbooks`: workspace_id, version, sections JSON, updated_by, updated_at.
- `front_desk_messages`: lead_id, workspace_id, direction, channel, body, attachments JSON, provider_ids, created_at.
- `front_desk_reply_drafts`: lead_id, workspace_id, body, status (`awaiting_approval | approved | sent | couldnt_send | discarded`), approved_by, approved_at, sent_at, error, prompt_version.
- `front_desk_connections`: workspace_id, provider (`instagram | gmail_send | email_domain`), encrypted tokens (reuse the QuickBooks token-encryption pattern), scopes, status, expires_at.
- `front_desk_reels`, `front_desk_ig_reports`: same fields as the Command Suite HQ prototype (title, why, script, caption, scheduled_at, status, video_key, permalink; weekly report JSON).
- Every table carries `workspace_id`; add each to `test-sql-isolation.mjs` and `test-workspace-isolation.mjs`.

## 6. Phases mapped to this repo

| Phase | Work | Depends on |
| --- | --- | --- |
| 0 | This audit + fixes (done) | — |
| 0.5 | Publish this branch so the live site matches the code | Barbie says "Publish it" |
| 1 | Migration 0036 (`drizzle/0036_front_desk.sql`), `scripts/test-front-desk-isolation.mjs` (done) | — |
| 2 | Lead intake: per-workspace inbound email (Cloudflare Email Routing → Worker), embeddable form posting to `/api/front-desk/intake/<token>` | Option A |
| 3 | AI triage and drafts (done): `app/front-desk.ts`, forced tool-call JSON, playbook editor tab, public form `/api/front-desk/intake/<form_token>` | `ANTHROPIC_API_KEY` |
| 4 | Dashboard (done): `/command/front-desk` (Today, Leads, lead drawer, Approve and send, Add a message, Setup) | 1–3 |
| 5 | Sending approved replies via Resend from the customer's verified domain, Reply-To fallback | Resend domain setup per customer |
| 6 | Stripe Checkout + Customer Portal; map products to `plan_tier`/`bundle_key`; webhooks | Stripe account |
| 7 | Instagram (Meta app, DM webhooks, insights, weekly report) | Meta Business Verification + App Review |
| 8 | Reels: renderer in a Cloudflare Container, Runway API, R2 storage, cron posting | Option A, Runway API key |
| 9 | Marketing pages: "Win more jobs" / "Run your jobs", bundle on pricing | — |
| 10 | Hardening, monitoring, data export/deletion pages (Meta requires one) | — |

## 7. New environment variables (names only)

`ANTHROPIC_API_KEY`, `FRONT_DESK_MODEL`, `FRONT_DESK_AI_BASE_URL`, `RUNWAY_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `META_APP_ID`, `META_APP_SECRET`, `FRONT_DESK_TOKEN_ENCRYPTION_KEY`, `LEAD_NOTIFICATION_EMAIL` (added in this audit).

## 8. Known limits of the current build

- AI triage runs inside the request (the public form waits a few seconds). Move it to a Queue once hosting is on Cloudflare (Option A).
- Approved email replies are sent from the platform address (`TRANSACTIONAL_EMAIL_FROM`) with Reply-To set to the contractor; per-customer verified domains are Phase 5.
- Instagram replies are copy-and-mark-sent until Phase 7.
- Front Desk access today: trial workspaces, internal owners, or `front_desk_settings.plan` set by staff. Stripe sets it in Phase 6.
