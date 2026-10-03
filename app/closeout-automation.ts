export const closeoutAutomationModule={
  key:'closeout-automation',name:'Module N — Closeout Automation',
  purpose:'Turn a passed inspection, verified jurisdiction source, and job type into an organized closeout path with a human-reviewed final package.',
  trigger:'An authorized Project Manager or Superintendent starts closeout preparation for a job with a passed inspection.',
  roles:[
    {name:'Superintendent',duties:'Completes the field punch, captures final photos, verifies site condition, and receives the internal completion notice.'},
    {name:'Project Manager',duties:'Reviews warranties, approvals, as-builts, final package assembly, review, and export readiness.'},
    {name:'Office Admin',duties:'Receives the closeout-prep notice and coordinates the final job record and customer handoff.'},
  ],
  behaviors:[
    'Generate closeout requirements from the verified jurisdiction profile, job type, and internal closeout standards.',
    'Create one Closeout Task Group inside the workspace-owned job.',
    'Assign field-closeout tasks to the Superintendent and package-review tasks to the Project Manager.',
    'Create a Closeout Prep card in the Command Inbox for human review.',
    'Create or reuse the job’s compliance record and attach the Closeout Checklist.',
    'Create internal required-document, required-photo, and verification lists.',
    'Create Final Package Assembly, Final Package Review, and Final Package Export tasks.',
    'Notify the Office Admin inside the workspace when closeout preparation is ready.',
    'After a person finalizes closeout, notify the Superintendent and create the next Command Inbox step.',
  ],
  artifacts:['Closeout Task Group','Role-assigned closeout tasks','Closeout Prep Command Inbox card','Closeout Checklist','Required documents list','Required photos list','Verification items','Final package task set','Internal role notifications','Finalized closeout and next-step record'],
  integrationPoints:['Job record','Compliance engine','Jurisdiction engine','Workflow engine','Command Inbox'],
  trialBoundary:'The existing server-calculated 14-day trial boundary applies. Module N does not start, extend, shorten, renew, or charge a trial.',
  isolationBehavior:'Every closeout group, task, requirement, notice, run, job lookup, checklist, finalization, and workflow update is authorized with the authenticated workspace ID.',
  limitations:['Generated requirements organize official sources and internal closeout standards; they do not guarantee jurisdiction acceptance or contractual completeness.','The Command Suite does not submit closeout documents, communicate with a jurisdiction, or deliver a package to a customer.','Final Package Export is a tracked human task; this module does not represent an automatic external export.','Notifications remain inside the protected workspace; this module does not send email or SMS.'],
  publishingNotes:['Protected staging module only.','Do not place Module N on public marketing pages or production navigation until the owner explicitly says “Publish it.”','Keep public claims aligned with the human-reviewed finalization and delivery boundary.'],
} as const;

export const closeoutTaskBlueprint=[
  {key:'field-punch',title:'Complete and document the final field punch',role:'superintendent'},
  {key:'final-photos',title:'Capture the required final photo set',role:'superintendent'},
  {key:'site-condition',title:'Verify cleanup, owner items, and final site condition',role:'superintendent'},
  {key:'collect-records',title:'Collect warranties, approvals, as-builts, and final records',role:'project_manager'},
  {key:'package-assembly',title:'Final Package Assembly',role:'project_manager'},
  {key:'package-review',title:'Final Package Review',role:'project_manager'},
  {key:'package-export',title:'Final Package Export',role:'project_manager'},
] as const;

export const closeoutJobTypeVerification:Record<string,string[]>={
  remodel:['Verify owner selections, change documentation, and affected-area completion.','Confirm final condition photos cover every remodeled area.'],
  'new-construction':['Verify certificate, final inspection, utility, and turnover records as applicable.','Confirm as-built and equipment documentation is complete.'],
  trade:['Verify applicable equipment startup, warranty, and trade sign-off records.','Confirm the trade scope and final condition are documented.'],
  general:['Verify approved scope, final inspection result, warranties, photos, and turnover records.'],
};
