export const fullPipelineAutomationModule={
  key:'full-pipeline-automation',name:'Module O — Full Pipeline Automation',
  purpose:'Connect lead, permit, inspection, corrective, closeout, and final-package work into one protected job timeline with a clear next step.',
  trigger:'A workspace owner enables the pipeline for a job, or a connected Module K–N stage changes state.',
  connections:[
    {from:'Lead Automation',to:'Permit Automation',rule:'A converted lead with a verified jurisdiction triggers permit preparation; missing jurisdiction data creates a blocking alert.'},
    {from:'Permit Automation',to:'Inspection Automation',rule:'A recorded permit submission triggers inspection preparation; the configured inspection type remains human-confirmed.'},
    {from:'Inspection Automation',to:'Closeout Automation',rule:'A passed inspection triggers closeout preparation. A failed inspection triggers the corrective path and a PM alert.'},
    {from:'Closeout Automation',to:'Final Package',rule:'Completed closeout tasks trigger final-package assembly status. Human review, export, delivery, and billing remain explicit tasks.'},
  ],
  behaviors:['Create a Pipeline Status card in the Command Inbox.','Create a job-linked Pipeline Progress timeline.','Create a Pipeline Next Step card after every stage.','Create open alerts for missing information, blocked work, or recorded delays.','Create a Pipeline Completion card after human-finalized closeout.','Notify Office Admin at each transition, Superintendent for field stages, and Project Manager for corrective work.'],
  artifacts:['Pipeline instance','Pipeline Status card','Pipeline Progress timeline','Pipeline Next Step cards','Pipeline alerts','Role notification queue','Pipeline Completion card','Owner-only automation log'],
  integrationPoints:['Lead engine','Job record','Workflow engine','Compliance engine','Jurisdiction engine','Command Inbox'],
  trialBoundary:'The existing server-calculated 14-day trial boundary applies. Module O does not start, extend, shorten, renew, or charge a trial.',
  isolationBehavior:'Every pipeline instance, event, alert, notice, job lookup, and Command Inbox card is read or written with the authenticated workspace ID.',
  limitations:['Government submission, inspection scheduling, pass/fail decisions, final package export, customer delivery, and billing remain human actions.','Automation pauses and creates an alert when required information is missing instead of guessing.','Internal checklists, drafts, alerts, and logs never appear on public pages.','Module O does not modify pricing tiers, Bundles, or trial dates.'],
  publishingNotes:['Protected staging module only.','Do not expose Module O, its cards, or its logs on the production website until the owner explicitly says “Publish it.”','Automation logs are restricted to workspace owners; the timeline and cards remain inside the authenticated workspace.'],
} as const;

export const pipelineStages=[
  {key:'lead',label:'Lead → Job'},{key:'permit',label:'Permit preparation'},{key:'inspection',label:'Inspection'},{key:'corrective',label:'Corrective work'},{key:'closeout',label:'Closeout'},{key:'final_package',label:'Final package'},{key:'complete',label:'Complete'},
] as const;
