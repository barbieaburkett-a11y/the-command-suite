export const inspectionAutomationModule={
  key:'inspection-automation',name:'Module M — Inspection Automation',
  purpose:'Turn a submitted permit record, verified jurisdiction source, job type, and inspection type into an organized inspection-preparation path inside the job.',
  trigger:'An authorized Project Manager or Superintendent starts inspection preparation for a job with a recorded permit submission.',
  roles:[
    {name:'Superintendent',duties:'Confirms site readiness, documents the work, attends the inspection, and records the result.'},
    {name:'Project Manager',duties:'Confirms permit conditions, scope, drawings, and correction or next-milestone actions.'},
    {name:'Office Admin',duties:'Receives the internal scheduling notice and keeps the job record current.'},
  ],
  behaviors:[
    'Generate inspection requirements from the verified jurisdiction profile, job type, and internal inspection standards.',
    'Create an Inspection Task Group inside the workspace-owned job.',
    'Assign field-readiness tasks to the Superintendent and review tasks to the Project Manager.',
    'Create an Inspection Prep card in the Command Inbox for human review.',
    'Create or reuse the job’s Inspection Compliance Checklist.',
    'Create internal required-document, required-photo, and verification lists.',
    'Notify the Superintendent inside the workspace when inspection preparation is ready.',
    'After a person records scheduling, notify the Office Admin inside the workspace.',
    'After a person records completion, mark pass or fail, create a next-step card, and update the inspection follow-up workflow.',
  ],
  artifacts:['Inspection Task Group','Role-assigned inspection tasks','Inspection Prep Command Inbox card','Inspection Compliance Checklist','Required documents list','Required photos list','Verification items','Internal role notifications','Pass/fail result and follow-up record'],
  integrationPoints:['Job record','Compliance engine','Jurisdiction engine','Workflow engine','Command Inbox'],
  trialBoundary:'The existing server-calculated 14-day trial boundary applies. Module M does not start, extend, shorten, renew, or charge a trial.',
  isolationBehavior:'Every inspection group, task, requirement, notice, run, job lookup, schedule update, result, and workflow update is authorized with the authenticated workspace ID.',
  limitations:['The generated lists organize official source links and internal preparation standards; they do not guarantee a passed inspection.','The Command Suite does not request an inspection, communicate with an inspector, or monitor a government portal.','Scheduling and pass/fail are recorded only after a person completes or verifies the external action.','Notifications remain inside the protected workspace; this module does not send email or SMS.'],
  publishingNotes:['Protected staging module only.','Do not place Module M on public marketing pages or production navigation until the owner explicitly says “Publish it.”','Keep public claims aligned with the human-recorded scheduling and result boundary.'],
} as const;

export const inspectionTaskBlueprint=[
  {key:'confirm-permit',title:'Confirm permit conditions and inspection type',role:'project_manager'},
  {key:'review-drawings',title:'Review current drawings and prior correction notes',role:'project_manager'},
  {key:'confirm-milestone',title:'Confirm the work matches the requested inspection milestone',role:'project_manager'},
  {key:'site-access',title:'Confirm safe site access and inspector access',role:'superintendent'},
  {key:'field-readiness',title:'Confirm inspected work is complete and visible',role:'superintendent'},
  {key:'photo-record',title:'Capture the required pre-inspection photo set',role:'superintendent'},
] as const;

export const jobTypeVerification:Record<string,string[]>={
  remodel:['Verify existing conditions and affected occupied areas are documented.','Confirm altered work is visible and matches the approved scope.'],
  'new-construction':['Verify the current construction milestone is complete.','Confirm required preceding inspections are documented.'],
  trade:['Verify the applicable trade permit and equipment or system details.','Confirm the trade work is accessible for inspection.'],
  general:['Verify the inspection milestone, approved scope, and site readiness.'],
};
