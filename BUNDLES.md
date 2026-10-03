# Protected workspace Bundles

Bundles are the operational access packages for a company workspace. Pricing Tiers remain the commercial configuration. After trial, a module must be included by both configurations; this fail-closed rule prevents an out-of-sync setting from elevating access.

## Bundles

- **Operations:** Workflow Playbooks, Jobs, Customers, Files, Schedule, and Activity Log.
- **Compliance:** Operations plus the ten-module Compliance Pack.
- **Jurisdiction:** Compliance plus the state, county, and city Jurisdiction Library.
- **Enterprise:** the full current module set, unlimited job and workflow entitlements, and a priority-support path.

Command Inbox and Crew Intake are protected shared workspace services. They remain foundational to field-to-office capture and are not silently counted among the user-defined Bundle modules.

## Boundaries

- A 14-day active trial receives all module access.
- Post-trial access is checked on protected pages and APIs.
- Every database query continues to use the authenticated `workspace_id`.
- Bundle configuration cannot be changed by the workspace interface.
- No Bundle submits to or signs into a government portal.
- Enterprise multi-company administration is planned. The verified boundary remains one primary company workspace per account.
- Bundles are private staging configuration and are not published marketing pages.

## Migration

`drizzle/0012_bundles.sql` adds `bundle_key` and maps existing Starter, Standard, Premium, and Enterprise workspaces to Operations, Compliance, Jurisdiction, and Enterprise respectively. No customer or job records are changed.

## Verification

`scripts/test-bundle-access.mjs` verifies trial access, each paid Bundle boundary, and fail-closed behavior when a pricing tier and Bundle do not agree.
