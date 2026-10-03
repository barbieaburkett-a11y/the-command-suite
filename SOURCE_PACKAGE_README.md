# The Command Suite source package

This archive contains the committed source code for The Command Suite website and contractor CRM from branch `repair/public-marketing-unification`, commit `eb95e60466274a295d8f0e4a07de1cf31e0ca95d`.

Included: public pages, authenticated workspace pages, React components, API routes, configuration, `package.json`, `pnpm-lock.yaml`, Cloudflare D1 migrations, scripts, tests, and tracked static assets.

Excluded intentionally: `.env` files, secret values, Git metadata, dependencies (`node_modules`), generated build output, caches, local D1 databases, local R2 data, and test/runtime artifacts.

## Local setup

Requirements: Node.js 22.13 or newer and pnpm.

```text
pnpm install --frozen-lockfile
pnpm lint
pnpm build
pnpm run private:staging
```

Review `package.json`, `.openai/hosting.json`, and the scripts directory for the complete command and Cloudflare configuration.

## Environment variable names

The following names are referenced by the application or its included operational scripts. Supply values through local environment configuration or the hosting platform's secret/configuration system. No values are included in this archive.

### Authentication and workspace administration

- `AUTH_REQUIRE_EMAIL_VERIFICATION`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `COMMAND_ADMIN_EMAILS`
- `COMMAND_ADMIN_USER_IDS`

### Public application links

- `PUBLIC_APP_URL`
- `PUBLIC_LOGIN_URL`
- `PUBLIC_SIGNUP_URL`

### Transactional email

- `RESEND_API_KEY`
- `TRANSACTIONAL_EMAIL_FROM`
- `TRANSACTIONAL_EMAIL_REPLY_TO`
- `LEAD_NOTIFICATION_EMAIL` (optional; where new website-lead alerts go, defaults to `TRANSACTIONAL_EMAIL_REPLY_TO`)
- `ANTHROPIC_API_KEY` (optional; turns on Command Front Desk AI reply suggestions. Without it, leads are still saved and shown, with no suggested reply)
- `FRONT_DESK_MODEL` (optional; Claude model id for Front Desk, defaults to `claude-sonnet-4-5`)
- `FRONT_DESK_AI_BASE_URL` (optional; only for an AI gateway or local testing, defaults to `https://api.anthropic.com`)

### QuickBooks Online

- `QUICKBOOKS_CLIENT_ID`
- `QUICKBOOKS_CLIENT_SECRET`
- `QUICKBOOKS_ENVIRONMENT`
- `QUICKBOOKS_REDIRECT_URI`
- `QUICKBOOKS_SCOPES`
- `QUICKBOOKS_TOKEN_ENCRYPTION_KEY`

### Local staging and test scripts

- `PRIVATE_STAGING_DATA_DIR`
- `PRIVATE_STAGING_PORT`
- `TEST_ADMIN_EMAIL`
- `TEST_D1_DIR`
- `TEST_ORIGIN`

### Release safeguard

- `APPROVED_RELEASE_COMMIT`

## Cloudflare resource bindings

These are platform bindings rather than secret scalar environment variables:

- `DB` — Cloudflare D1 database binding
- `FILES` — Cloudflare R2 bucket binding

## Security note

Never commit `.env`, `.env.local`, API keys, OAuth client secrets, authentication secrets, encryption keys, access tokens, refresh tokens, or production data. Use separate credentials and storage for development, staging, and production.
