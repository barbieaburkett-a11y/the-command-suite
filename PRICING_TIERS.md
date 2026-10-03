# Pricing Tiers — private staging configuration

## Access model

Every company workspace stores one `plan_tier`: `starter`, `standard`, `premium`, or `enterprise`. The value is read with the authenticated membership and never accepted from an ordinary workspace form.

- During an active 14-day trial, every module is available.
- After the trial, active paid workspaces receive the modules configured for their tier.
- Protected pages redirect an unavailable module to `/command/plans`.
- Protected APIs return `403 upgrade_required` for an unavailable module.
- Hiding a navigation item is a usability feature, not the security boundary.

## Foundational modules

Command Inbox and Crew Intake are included in all tiers because they are required for the field-to-office workflow. They are treated as foundational access in addition to the modules explicitly listed for Starter.

## Tier progression

- Starter: foundational modules, Workflow Playbooks, Jobs, Customers, Files, Schedule, and Activity Log.
- Standard: Starter plus Compliance Pack.
- Premium: Standard plus the full Jurisdiction Library.
- Enterprise: all current modules, unlimited job/workflow entitlements, and priority-support positioning.

## Limits

The approved definitions say small, medium, and large contractor usage but do not assign numbers for jobs, crew, storage, or workflows. No numeric cap is invented or silently enforced. Exact quotas require a separate approved product decision.

## Enterprise limitation

Enterprise shows multi-company administration as planned because the production-safe account model currently resolves one primary company workspace per account. Cross-company switching will not be claimed or exposed until its authorization model and browser workflows are implemented and tested.

## Billing boundary

The protected tier page is configuration and sales reference material, not checkout. It does not charge a card, change a subscription, or allow a workspace owner to elevate their own tier. A plan change must be confirmed outside this page and applied through an authorized administrative process.

## Migration

Apply `drizzle/0011_pricing_tiers.sql` after migrations `0000` through `0010`. Existing workspaces receive `starter` by default without changing their records.

## Acceptance tests

- `scripts/test-workspace-isolation.mjs`: two-company isolation and job-record protection.
- `scripts/test-pricing-access.mjs`: Starter permits Workflows but denies Compliance and Jurisdictions; Standard permits Compliance but denies Jurisdictions; Premium and Enterprise permit Jurisdictions.
- `scripts/test-sql-isolation.mjs`: database predicates deny cross-company record access.

## Publishing status

Private local staging only. No production deployment is part of this implementation.
