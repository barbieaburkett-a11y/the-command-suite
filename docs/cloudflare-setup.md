# Running The Command Suite on our own Cloudflare account

The app already builds for Cloudflare Workers (`@cloudflare/vite-plugin`). OpenAI Sites only supplied the
database and bucket IDs; on our own account these build variables supply them instead:

| Build variable | Value |
| --- | --- |
| `CF_WORKER_NAME` | `the-command-suite` |
| `CF_D1_DATABASE_NAME` | `command-suite-db` |
| `CF_D1_DATABASE_ID` | the D1 database ID from the Cloudflare dashboard |
| `CF_R2_BUCKET` | `command-suite-files` |

## Workers Builds (Cloudflare dashboard → Workers & Pages → Create → Import a repository)

- Build command: `pnpm build`
- Deploy command: `npx wrangler d1 migrations apply DB --remote --config dist/server/wrangler.json && npx wrangler deploy`
- Non-production branch deploys: off

`wrangler d1 migrations apply` records applied files in `d1_migrations`, so every deploy only runs new ones.
Tested locally: all 37 migrations (0000–0036) apply in order; dry-run upload is ~714 KiB gzipped (free plan limit 3 MiB).

## Runtime settings (Worker → Settings → Variables and Secrets). Typed by the owner, never pasted into chat.

Secrets: `BETTER_AUTH_SECRET` (32+ random characters), `RESEND_API_KEY`, later `ANTHROPIC_API_KEY`, Stripe keys.
Plain variables: `BETTER_AUTH_URL` (the workers.dev address first, then `https://thecommandsuite.com`),
`TRANSACTIONAL_EMAIL_FROM`, `TRANSACTIONAL_EMAIL_REPLY_TO`, `LEAD_NOTIFICATION_EMAIL`, `COMMAND_ADMIN_EMAILS`.

## Cut-over

1. Test everything on the `*.workers.dev` address.
2. Copy any data worth keeping from the Sites database (accounts, leads) — export once from Sites.
3. Add thecommandsuite.com to Cloudflare, keep the existing email (MX) records, change nameservers at Namecheap.
4. Add the custom domain to the Worker; set `BETTER_AUTH_URL` to `https://thecommandsuite.com`.
