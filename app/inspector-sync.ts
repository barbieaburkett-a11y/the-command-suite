export const inspectorCategories=[
  {key:'building',label:'Building'},{key:'electrical',label:'Electrical'},{key:'mechanical',label:'Mechanical'},{key:'plumbing',label:'Plumbing'},{key:'fire',label:'Fire'},{key:'specialty',label:'Specialty'},
] as const;
export const inspectionCategories=[
  {key:'rough',label:'Rough'},{key:'final',label:'Final'},{key:'safety',label:'Safety'},{key:'permit',label:'Permit'},{key:'specialty',label:'Specialty'},
] as const;
export const inspectionAudiences=[{key:'internal',label:'Internal team'},{key:'inspector',label:'Inspector'},{key:'vendor',label:'Vendor'},{key:'customer',label:'Customer'},{key:'packet',label:'Packet Builder'}] as const;
export const inspectorSyncModule={
  name:'Module Y — Inspector Sync',
  purpose:'Keep inspector availability, inspection preparation, results, evidence, corrections, and downstream job actions connected without exposing private company records.',
  roles:['Office Admin — maintains profiles, requests, documents, forms, and official scheduling details.','Project Manager — resolves dependencies, assigns cost, approves readiness, and reviews results.','Superintendent — confirms field readiness, photos, vendor actions, corrections, and follow-up work.'],
  artifacts:['Workspace inspector profile','Versioned inspection template','Inspection request and readiness score','Prep checklist and dependency record','Inspector-side update link','Protected document and photo evidence','Result, correction, and follow-up record','Review-required inspection summary','Scheduling and QuickBooks review record'],
  integrationPoints:['Jobs and workflows','Module X compliance readiness and result updates','Module W availability, recommendations, conflicts, and delays','Module V inspection sections and packets','Module S cost codes and Module T protected financial review','Module U issue detection, escalation, summaries, and packet preparation'],
  limitations:['Inspector availability is entered by the company or inspector; Module Y does not access a government calendar.','The private inspector link exposes only the assigned request and never exposes company notes, other jobs, or calendars.','External notifications remain drafts unless separately enabled and approved.','The module does not request an official inspection, represent an inspector, guarantee a result, or post to QuickBooks automatically.'],
  publishingNotes:['Protected staging only.','No public production navigation or discoverable inspector directory is created.'],
} as const;
