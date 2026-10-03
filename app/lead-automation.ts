export const leadAutomationModule = {
  key: 'lead-automation',
  name: 'Module K — Lead Automation',
  purpose: 'Turn one protected lead intake into the connected customer, job, workflow, jurisdiction, compliance, Command Inbox, and internal-notification records the office needs next.',
  trigger: 'An authorized office user saves a qualified lead and starts the internal automation.',
  roles: [
    { name: 'Office Admin', duties: 'Confirms the lead, customer, job, jurisdiction, and first office next step.' },
    { name: 'Project Manager', duties: 'Reviews the assigned playbook and any permit or inspection requirements.' },
    { name: 'Superintendent', duties: 'Receives the internal job-start notice and confirms field readiness.' },
  ],
  behaviors: [
    'Create a workspace-owned job from the lead.',
    'Create or reuse the workspace customer and link it to the job.',
    'Choose the Permit Workflow when a jurisdiction is supplied; otherwise choose the Job Record Workflow.',
    'Attach the selected jurisdiction record when the active entitlement allows it.',
    'Create internal permit and inspection requirement checklists when the Compliance Pack is available.',
    'Create a next-step card in the Command Inbox for human review.',
    'Queue internal-only notices for the Office Admin and Superintendent roles.',
  ],
  artifacts: [
    'Workspace lead record',
    'Linked customer record',
    'Linked job record',
    'Workflow instance and checklist',
    'Eligible compliance and jurisdiction records',
    'Command Inbox next-step card',
    'Internal role notifications',
    'Automation run record',
  ],
  integrationPoints: ['Lead intake', 'Job creation', 'Workflow engine', 'Compliance engine', 'Jurisdiction engine', 'Command Inbox'],
  trialBoundary: 'The existing server-calculated 14-day trial boundary applies. This module does not start, extend, shorten, renew, or charge a trial.',
  isolationBehavior: 'Every customer-owned read and write includes the authenticated workspace ID. Jurisdiction catalog rows are shared reference data; linked job records remain company-scoped.',
  limitations: [
    'Notifications remain inside the protected workspace; this module does not send email or SMS.',
    'Permit and inspection records organize internal work only. The Command Suite does not submit to or sign in to a government portal.',
    'Automation never marks consequential work approved. The Command Inbox card requires human review.',
    'Compliance and jurisdiction steps are skipped and recorded when the active plan or Bundle does not include those modules.',
  ],
  publishingNotes: [
    'Protected staging module only.',
    'Do not add this feature to public marketing or production navigation until the owner explicitly says “Publish it.”',
    'Keep claims aligned with the actual internal-only behaviors above.',
  ],
} as const;

export function defaultLeadWorkflow(jurisdictionId: string | null) {
  return jurisdictionId ? 'permit' : 'job-record';
}
