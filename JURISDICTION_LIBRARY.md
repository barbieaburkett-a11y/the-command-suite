# Jurisdiction Library

## Purpose and boundary

The Jurisdiction Library is a protected, job-linked module inside each contractor company workspace. It organizes a national state → county/equivalent → city/place directory and company-private permit and inspection tracking records.

It does **not** submit permits, connect to government portals, interpret building codes, monitor third-party portals, or guarantee approval. A geographic directory entry is not an official permit source.

## Dataset

- 50 states
- 3,152 counties and county equivalents
- 29,778 cities and places associated with their state and county
- 32,980 total searchable jurisdiction rows

County and state geography comes from the U.S. Census Bureau 2025 Gazetteer. City-to-county reference data comes from the MIT-licensed `kelvins/US-Cities-Database` project. These sources establish the searchable hierarchy only.

Official portal and requirement fields use two statuses:

- `verified`: manually checked official starting points with source and last-checked date
- `directory_only`: geographic record present, but portal and requirements must be verified

The initial verified profiles are Rock Hill, South Carolina; York County, South Carolina; and Mecklenburg County, North Carolina. Every other location is visibly labeled **Verification required**.

## Workspace data model

- `jurisdiction_catalog`: shared geographic reference records; contains no company data
- `jurisdiction_profiles`: official-source fields and verification status; contains no company data
- `workspace_jurisdiction_records`: job-linked company records, always queried by `workspace_id`
- `jurisdiction_checklist_records`: company checklist progress, always queried by `workspace_id` and record ID

Every create, read, update, and delete operation for a job-linked record validates the active session, the 14-day trial boundary, the company workspace, and the selected job.

## Apply the migration

The private staging runner applies `drizzle/0010_jurisdiction_library.sql` automatically. For another D1 environment, apply migrations in numeric order using the project’s approved D1 migration process. Do not apply this migration to production until publishing is explicitly approved.

To rebuild the national seed file from its documented sources:

```text
node scripts/build-jurisdiction-library.mjs
```

The generator is intentionally separate from the application runtime. Production builds do not fetch third-party datasets.

## Acceptance coverage

- Protected workspace route: `/command/jurisdictions`
- Protected API: `/api/command/jurisdictions`
- State, county, and city selectors
- Verified-source and verification-required states
- Job linking and duplicate-record reuse
- Permit/inspection form, checklist, roles, artifacts, and integration points
- Printable record layout
- Trial access enforcement through `workspaceContext`
- Two-company API isolation for jurisdiction records and checklist items
- SQL predicate isolation for cross-company reads, writes, and deletes

## Third-party notice

The city reference dataset is used under the MIT License:

Copyright (c) 2017 Kelvin S. do Prado. Permission is granted, free of charge, to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the software and associated documentation, subject to inclusion of the copyright and permission notice. The data and software are provided without warranty.
