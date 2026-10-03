export const smartDefaultsModule={
  name:'Module Q — Smart Defaults',purpose:'Pre-fill the internal workflow, compliance, permit, inspection, closeout, and vendor preparation that fits a classified job.',trigger:'A lead becomes a job, a job is classified, or an authorized user refreshes defaults after linking a verified jurisdiction.',
  roles:['Office Admin reviews sources and owns office follow-up.','Project Manager reviews scope, decisions, cost, and schedule tasks.','Superintendent owns field, photo, installation, and inspection-prep tasks.'],
  artifacts:['Versioned Smart Defaults snapshot','Role-aware workflow assignment','Compliance preparation records','Command Inbox Next Step card','Pipeline snapshot and automation log'],
  limitations:['Defaults are preparation aids—not official requirements or legal advice.','Jurisdiction-specific items appear only when the linked profile is marked verified.','No permit submission, inspection scheduling, vendor engagement, pricing change, or Bundle change is performed.'],
  publishingNotes:['Protected workspace route','Company-scoped queries','Existing 14-day trial and entitlement checks apply','Private staging only until explicit publishing approval'],
} as const;
