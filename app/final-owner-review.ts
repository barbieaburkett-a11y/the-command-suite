export const ownerReviewGroups=[
  {key:'modules',label:'Modules U–Z'},{key:'workflows',label:'Workflows'},{key:'packets',label:'Packet types'},{key:'scheduling',label:'Scheduling views'},
  {key:'dependencies',label:'Dependencies'},{key:'quickbooks',label:'QuickBooks gates'},{key:'security',label:'Protection boundaries'},{key:'layouts',label:'Layouts'},
] as const;
export const ownerReviewItems=[
  {key:'module_u',group:'modules',title:'Module U — Auto-Pilot Agent',href:'/command/auto-pilot',acceptance:'Confirm premium gating, disabled-by-default behavior, workspace Brand Profile, action approvals, and unsent external communications.'},
  {key:'module_v',group:'modules',title:'Module V — Packet Builder Pro',href:'/command/packet-builder',acceptance:'Confirm protected packet creation, human section review, PDF export gate, and workspace-scoped source records.'},
  {key:'module_w',group:'modules',title:'Module W — Scheduling AI',href:'/command/scheduling-ai',acceptance:'Confirm recommendations, conflict detection, resources, dependencies, cost review, and internal-only notifications.'},
  {key:'module_x',group:'modules',title:'Module X — Compliance AI',href:'/command/compliance-ai',acceptance:'Confirm versioned requirements, readiness scoring, dependencies, summaries, packets, and financial review.'},
  {key:'module_y',group:'modules',title:'Module Y — Inspector Sync',href:'/command/inspector-sync',acceptance:'Confirm private inspector profiles, readiness, scheduling, results, correction follow-up, files, and packet handoff.'},
  {key:'module_z',group:'modules',title:'Module Z — Permit Runner Network',href:'/command/permit-runner-network',acceptance:'Confirm private runner and office records, permit prep, corrections, files, schedule handoff, and no government submission claim.'},
  {key:'workflow_library',group:'workflows',title:'Workflow Playbook library',href:'/command/workflows',acceptance:'Open the protected playbook library and confirm role, trigger, steps, artifacts, job links, and trial behavior.'},
  {key:'workflow_pipeline',group:'workflows',title:'Lead-to-closeout pipeline',href:'/command/full-pipeline-automation',acceptance:'Confirm Lead → Permit → Inspection → Closeout transitions, next-step cards, alerts, correction branch, and owner-only logs.'},
  ...['permit','inspection','closeout','warranty','customer_summary','vendor_summary','compliance','job_financial_summary'].map(key=>({key:`packet_${key}`,group:'packets',title:`${key.replaceAll('_',' ')} packet`,href:'/command/packet-builder',acceptance:'Build, review, print, and export only from an authorized company workspace.'})),
  ...['calendar','timeline','job','vendor','inspector','customer','workflow'].map(key=>({key:`schedule_${key}`,group:'scheduling',title:`${key} view`,href:'/command/scheduling-ai',acceptance:'Confirm the view preserves workspace scope, job context, dependencies, resources, conflicts, and private contact details.'})),
  {key:'dependency_compliance',group:'dependencies',title:'Compliance dependencies',href:'/command/compliance-ai',acceptance:'Confirm required documents, photos, tasks, vendor/customer actions, readiness, and scheduling blockers.'},
  {key:'dependency_inspection',group:'dependencies',title:'Inspection dependencies',href:'/command/inspector-sync',acceptance:'Confirm failed and conditional inspections require correction follow-up before downstream completion.'},
  {key:'dependency_permit',group:'dependencies',title:'Permit dependencies',href:'/command/permit-runner-network',acceptance:'Confirm corrections-required permits produce protected follow-up records and do not imply government submission.'},
  {key:'quickbooks_mapping',group:'quickbooks',title:'Connection and mapping review',href:'/command/quickbooks',acceptance:'Confirm workspace OAuth connection, account mappings, token protection, and owner-only controls.'},
  {key:'quickbooks_queue',group:'quickbooks',title:'Financial sync review gates',href:'/command/quickbooks',acceptance:'Confirm no packet, schedule, compliance, inspection, or permit financial record becomes sync-ready without entitlement, connection, and mapping.'},
  {key:'security_routes',group:'security',title:'Protected routes',href:'/command/pre-publish-hardening',acceptance:'Confirm anonymous visitors are rejected and internal routes remain authenticated.'},
  {key:'security_entitlements',group:'security',title:'Trial and entitlements',href:'/command/plans',acceptance:'Confirm the 14-day trial, plan, bundle, and premium add-on boundaries are enforced by server queries.'},
  {key:'security_isolation',group:'security',title:'Company isolation',href:'/command/pre-publish-hardening',acceptance:'Confirm customers, jobs, files, schedules, packets, vendors, inspectors, runners, and automation logs cannot cross companies.'},
  {key:'layout_desktop',group:'layouts',title:'Desktop layout',href:'/command',acceptance:'Review navigation, hierarchy, tables, forms, cards, controls, and long-content behavior at desktop width.'},
  {key:'layout_mobile',group:'layouts',title:'Mobile layout',href:'/command',acceptance:'Review single-column reflow, tap targets, form controls, cards, tables, and horizontal overflow at phone width.'},
  {key:'layout_print',group:'layouts',title:'Print layouts',href:'/command/pre-publish-hardening',acceptance:'Print-preview packets and owner reports; confirm controls are hidden and cards avoid page breaks.'},
] as const;
export const finalOwnerReviewModule={
  name:'Final Owner Review',purpose:'Give the system owner one protected, printable walkthrough for verifying Modules U–Z, workflows, packets, schedules, dependencies, financial gates, security boundaries, and responsive layouts before any publishing decision.',
  roles:['System Owner — completes and records every review decision.','Office Admin — supplies realistic operating records for review.','Project Manager — validates job, workflow, dependency, packet, and schedule behavior.'],
  artifacts:['Owner review checklist','Per-item notes and decision','Live protected module links','Coverage evidence','Locked publish-gate status','Printable owner review record'],
  limitations:['Review status records an owner decision; it does not deploy or unlock production.','External portals, third-party uptime, and live delivery are not represented as verified.','Mobile and print acceptance still require human visual judgment.'],
  publishingNotes:['Protected staging only.','The publish gate remains locked regardless of checklist completion.','Only a later explicit “Publish it” instruction can begin a separate deployment workflow.'],
} as const;
