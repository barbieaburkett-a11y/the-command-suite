export const hardeningCategories=[
  {key:'protected_routes',label:'Protected routes'},{key:'trial',label:'Trial boundary'},{key:'entitlements',label:'Entitlements'},{key:'workspace_isolation',label:'Workspace isolation'},
  {key:'packets',label:'Packet Builder'},{key:'scheduling',label:'Scheduling AI'},{key:'quickbooks',label:'QuickBooks review gates'},{key:'compliance',label:'Compliance AI'},
  {key:'inspection',label:'Inspector Sync'},{key:'permit',label:'Permit Runner Network'},{key:'files',label:'Protected files'},{key:'publishing',label:'Publish safety'},
] as const;
export const prePublishHardeningModule={
  name:'Module AA — Pre-Publish Hardening',
  purpose:'Convert release readiness into a recorded, repeatable safety gate across protected routes, tenant isolation, entitlements, trial limits, packets, schedules, financial review, dependencies, files, and publishing controls.',
  roles:['Office Admin — reviews operational findings and confirms staging data.','Project Manager — validates job, workflow, compliance, schedule, packet, inspection, and permit behavior.','System Owner — resolves failed gates and provides explicit publishing approval only after a passing run.'],
  artifacts:['Versioned hardening run','Category-level pass/fail evidence','Workspace-isolation audit','Entitlement and trial audit','Packet and scheduling stress result','QuickBooks review-gate result','Compliance, inspection, and permit dependency audit','Protected-file path audit','Locked publish-gate record','Printable pre-publish report'],
  integrationPoints:['All protected workspace routes','Modules A–Z and the contractor workspace','Module V Packet Builder Pro','Module W Scheduling AI','Module T QuickBooks review gates','Modules X, Y, and Z dependency records','Authentication, trials, entitlements, D1, and R2 object paths'],
  limitations:['A database audit cannot replace external penetration testing, browser compatibility labs, or production monitoring.','A passed staging run does not publish, authorize publishing, or prove third-party uptime.','QuickBooks checks validate local review gates and mappings; they do not post financial data.','Government portal behavior is outside this application and is not represented as verified.'],
  publishingNotes:['Staging-only and protected.','The publish gate remains locked after every hardening run.','Only a separate explicit production instruction may authorize a deployment.'],
} as const;
