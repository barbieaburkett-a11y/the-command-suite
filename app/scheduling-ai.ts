export const schedulingViews=['calendar','timeline','job','vendor','inspector','customer','workflow'] as const;
export const schedulingItemTypes=[
  {key:'job',label:'Job work'},
  {key:'workflow',label:'Workflow task'},
  {key:'vendor',label:'Vendor work'},
  {key:'inspector',label:'Inspection appointment'},
  {key:'customer',label:'Customer appointment'},
  {key:'team',label:'Internal team work'},
] as const;
export const schedulingModule={
  name:'Module W — Scheduling AI',
  purpose:'Turn job readiness, people, dependencies, and cost information into reviewable scheduling recommendations without exposing private calendars.',
  trigger:'An office user selects a job and asks for the next schedulable activity or creates a protected schedule item.',
  roles:['Office Admin — maintains resources, accepts recommendations, and controls notifications','Project Manager — confirms readiness, dependencies, cost code, and schedule changes','Superintendent — reviews field windows, inspection readiness, and completion'],
  artifacts:['Schedule event','Resource availability record','Readiness assessment','Conflict alert','Date and resource recommendation','Cost estimate','QuickBooks sync-review item','Internal notification draft','Scheduling summary'],
  integrationPoints:['Jobs and customers','Workflow playbooks','Permit, inspection, closeout, warranty, and compliance dependencies','Vendor Manager','Module S cost codes','Module T QuickBooks mappings and financial endpoints','Module U Auto-Pilot recommendations and alerts'],
  limitations:['Calendar synchronization is internal-only and no external calendar is connected by this module.','Email and SMS are drafts only; nothing is sent automatically.','Vendor, inspector, and customer availability is based only on availability entered in this workspace.','QuickBooks costs are queued for review and are not synced automatically.','Recommendations are operational drafts and require a human scheduling decision.'],
  publishingNotes:['Protected staging route only.','No vendor or inspector calendar is public.','No production navigation or deployment until explicit approval.'],
} as const;
