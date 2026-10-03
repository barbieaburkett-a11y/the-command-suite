export const permitAutomationModule = {
  key: 'permit-automation',
  name: 'Module L — Permit Automation',
  purpose: 'Turn a job-linked, verified jurisdiction record into an organized permit-preparation task group, compliance checklist, source-backed requirement list, and Command Inbox review path.',
  trigger: 'An authorized Office Admin or Project Manager starts permit preparation from a job that already has a workspace-owned jurisdiction record.',
  roles: [
    { name: 'Office Admin', duties: 'Collects official forms and documents, maintains the permit packet, and records the submission.' },
    { name: 'Project Manager', duties: 'Reviews scope, plans, valuation, requirements, and the final packet before submission.' },
    { name: 'Superintendent', duties: 'Receives the internal submission notice and prepares for required inspections.' },
  ],
  behaviors: [
    'Generate permit-preparation requirements from the selected jurisdiction profile and internal compliance checklist.',
    'Create one Permit Task Group inside the workspace-owned job.',
    'Assign document and form tasks to the Office Admin; assign scope, plan, and packet review to the Project Manager.',
    'Create a Permit Prep card in the Command Inbox for human review.',
    'Create or reuse the job’s Permit Compliance Checklist.',
    'Create internal required-document, required-form, and required-inspection lists with their source and verification boundary.',
    'Notify the Office Admin inside the workspace when permit preparation is ready.',
    'After a person records submission, notify the Superintendent and create the next Command Inbox step.',
  ],
  artifacts: ['Permit Task Group','Role-assigned permit tasks','Permit Prep Command Inbox card','Permit Compliance Checklist','Required documents list','Required forms list','Required inspections list','Internal role notifications','Permit Automation run record'],
  integrationPoints: ['Job record','Compliance engine','Jurisdiction engine','Workflow engine','Command Inbox'],
  trialBoundary: 'The existing server-calculated 14-day trial boundary applies. Module L does not start, extend, shorten, renew, or charge a trial.',
  isolationBehavior: 'Every task group, task, requirement, notification, run, job lookup, compliance lookup, and status update is authorized with the authenticated workspace ID.',
  limitations: [
    'The generated lists organize current source material for human review; they do not guarantee completeness or jurisdiction acceptance.',
    'The Command Suite does not submit an application, sign in to a government portal, or detect portal status changes.',
    '“Record submitted” records a person’s completed external action. It does not perform that action.',
    'Notifications remain inside the protected workspace; this module does not send email or SMS.',
  ],
  publishingNotes: ['Protected staging module only.','Do not place this feature on public marketing pages or production navigation until the owner explicitly says “Publish it.”','Keep every public claim aligned with the human-controlled submission boundary.'],
} as const;

export const permitTaskBlueprint = [
  { key: 'confirm-jurisdiction', title: 'Confirm jurisdiction and official source', role: 'office_admin' },
  { key: 'collect-forms', title: 'Collect current official forms', role: 'office_admin' },
  { key: 'collect-documents', title: 'Collect required supporting documents', role: 'office_admin' },
  { key: 'review-scope', title: 'Review scope, valuation, and permit types', role: 'project_manager' },
  { key: 'review-plans', title: 'Review plans, specifications, and revisions', role: 'project_manager' },
  { key: 'approve-packet', title: 'Approve the permit packet before submission', role: 'project_manager' },
] as const;
