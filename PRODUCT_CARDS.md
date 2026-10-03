# Product Cards — private staging module

## Purpose

Product Cards are protected reference and navigation pages for the contractor workspace. They explain what a module does, when to use it, who owns the work, which artifacts it creates, where it connects to a job, and what it does **not** do.

## Protected route

- Catalog: `/command/modules`
- Job context: `/command/modules?projectId=<workspace-project-id>`
- Authentication, active trial/subscription access, and primary workspace membership are enforced by `requireWorkspace()` before the page renders.
- A supplied project ID is accepted only when the project belongs to the signed-in workspace and is active. An invalid or other-company ID falls back to a safe company-wide reference and exposes no job data.

## Modules represented

1. Workflow Playbooks — 10 playbooks
2. Compliance Pack — 10 modules
3. Jurisdiction Library — full geographic directory with explicit verification status
4. Command Inbox
5. Crew Intake
6. Job Management
7. Customer Management
8. Schedule Management
9. File Management
10. Activity Log

## Job-linked handoff

Every job card links to the Product Card catalog with that job selected. Workflow, Compliance Pack, and Jurisdiction Library pages accept the same job context and link back to their Product Card. Existing module APIs continue to enforce `workspace_id` for reads and writes.

## Honest boundaries

- Product Cards are static SOP descriptions; they do not create a second source of customer or job data.
- The Jurisdiction Library organizes references and tracking. It does not submit applications, sign into portals, monitor government systems, interpret code, or guarantee approval.
- The current Activity Log is record-centered; no complete company-wide reporting feed is claimed.
- Assisted routing is not described as an automatic native integration unless a destination is separately configured and verified.

## Validation

The automated two-organization test opens one company’s job-linked Product Card URL using the other company’s session and confirms the job name is not returned. The existing isolation test also covers customers, jobs, inbox records, files, proof packs, schedules, crew links, workflows, compliance records, and jurisdiction records.

## Publishing status

Private local staging only. No production deployment is part of this implementation.
