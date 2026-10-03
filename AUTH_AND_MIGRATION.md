# Contractor authentication and workspace migration

The contractor-facing application uses Better Auth email/password sessions with the existing Cloudflare D1 binding (`DB`). Better Auth owns password hashing and the `user`, `account`, `session`, and `verification` tables. The existing R2 binding (`FILES`) remains the file store.

## Required secrets

- `BETTER_AUTH_SECRET`: at least 32 high-entropy characters. Store it as a private staging/production secret, never in Git.
- `BETTER_AUTH_URL`: the exact HTTPS origin of the private contractor application.
- `COMMAND_ADMIN_USER_IDS` (optional): comma-separated Better Auth user IDs allowed to view the private lead inbox.
- `RESEND_API_KEY`: private Resend API key. Never store it in Git or expose it to browser code.
- `TRANSACTIONAL_EMAIL_FROM`: verified sender, for example `The Command Suite <account@thecommandsuite.com>`.
- `TRANSACTIONAL_EMAIL_REPLY_TO` (optional): support reply address, normally `hello@thecommandsuite.com`.

Email verification and password reset delivery activate only when both `RESEND_API_KEY` and `TRANSACTIONAL_EMAIL_FROM` are present. Without both values, the login remains usable for private staging and the password-reset screen explicitly directs users to support; it never claims an email was sent. Team invitations remain disabled.

## Migration order

Apply the numbered SQL files in `drizzle/` once and in order. The new changes are:

1. `0005_better_auth_workspace.sql`: Better Auth tables, contractor workspaces/memberships, workspace ownership columns, schedule events, and a lossless backfill of every legacy owner into exactly one legacy workspace.
2. `0006_single_primary_workspace.sql`: one primary company workspace per user for this initial product version.

Before applying to a remote database, export a D1 backup. Do not rerun `0005`; its `ALTER TABLE` statements are intentionally one-time operations. After migration, verify that these counts are zero:

```sql
SELECT COUNT(*) FROM customers WHERE workspace_id IS NULL;
SELECT COUNT(*) FROM projects WHERE workspace_id IS NULL;
SELECT COUNT(*) FROM command_records WHERE workspace_id IS NULL;
SELECT COUNT(*) FROM command_events WHERE workspace_id IS NULL;
SELECT COUNT(*) FROM command_files WHERE workspace_id IS NULL;
```

Legacy rows are preserved in `legacy_owner_workspaces`. Claiming a legacy workspace is an administrative ownership-verification step; it is deliberately not inferred from an unverified email.

## Security boundary

All authenticated CRM reads and mutations derive `workspace_id` from the server-side Better Auth session plus `contractor_memberships`. Client-provided workspace IDs are ignored. R2 object keys begin with the server-derived workspace ID. Crew tokens are random UUIDs, resolve to one job/workspace, and can be rotated or disabled.

## Private local staging

Build the application, then run `node scripts/start-private-staging.mjs`. The harness serves the compiled interface at `http://127.0.0.1:3002`, executes the Cloudflare Worker with D1/R2 bindings, and persists review data under the ignored `.local/private-staging` directory. It never deploys or changes the public website.

Run the acceptance suites before any remote staging deployment:

```text
node scripts/test-sql-isolation.mjs
node scripts/miniflare-auth-smoke.mjs
```

The integration suite creates two organizations and verifies signup, session restoration, logout/login, customer/job/schedule/inbox/file/proof isolation, direct-ID attacks, and crew-token revocation.

## Resend domain setup

Add `thecommandsuite.com` in Resend, then copy Resend's current DNS records exactly into the domain's DNS manager. Wait for Resend to show the domain as verified before creating the API key and configuring the three email variables above. Domain verification changes email delivery only; it does not move the existing `hello@thecommandsuite.com` mailbox.

## Remaining account-delivery limits

- Email delivery cannot be tested against real recipients until the Resend domain and API key are connected.
- Team invitations are not implemented in this owner-only release.
- This release supports one owner membership per account. Configurable team roles and invitations remain planned.
- Legacy workspaces require an administrative ownership check before they are assigned to a newly authenticated owner.
