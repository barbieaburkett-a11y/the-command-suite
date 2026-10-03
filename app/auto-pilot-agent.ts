export const autoPilotPrice = '$1,800/month';

export const autoPilotInputChannels = [
  ['Command Inbox email records','Reads email-origin records after they have been captured inside the workspace.'],
  ['Lead forms','Reads company-scoped workspace leads and intake details.'],
  ['Customer messages','Reads customer-origin messages already stored in the Command Inbox.'],
  ['Permit updates','Reads job-linked permit task groups and verified status changes.'],
  ['Inspection updates','Reads job-linked inspection preparation, schedules, and results.'],
  ['Job records','Reads company-owned job status, next action, project type, and customer links.'],
  ['Workflow changes','Reads assigned playbooks and completed workflow steps.'],
  ['Compliance changes','Reads company-scoped compliance instances and checklist progress.'],
  ['Cost code changes','Reads job budgets, actual costs, vendor allocations, invoices, and recorded payments inside the workspace.'],
  ['QuickBooks sync changes','Reads workspace-owned sync conflicts, report freshness, and financial mapping issues without exposing tokens.'],
] as const;

export const autoPilotActions = [
  'Create and classify leads from structured workspace intake',
  'Create linked customers and jobs when the required facts are present',
  'Apply Smart Defaults and the default workflow playbook',
  'Prepare missing-document, permit, inspection, and closeout actions',
  'Advance verified internal pipeline stages and create Next Step cards',
  'Create confirmations, reminders, and follow-up messages in the action queue',
  'Notify workspace roles and prepare customer, vendor, or inspector outreach',
  'Mark a job internally closed after verified closeout completion',
  'Suggest cost codes and create internal discrepancy summaries for human review',
  'Escalate QuickBooks conflicts and prepare cost-based closeout summaries without changing the books silently',
] as const;

export const autoPilotAgentModule = {
  name: 'Module U — Auto-Pilot Agent',
  purpose: 'Run a workspace-scoped operations queue that turns verified job activity into the next safe internal action, using each contractor’s own brand, preferences, records, and entitlements.',
  trigger: 'A company-owned lead, message, job, workflow, compliance, permit, inspection, vendor, or pipeline record changes.',
  roles: [
    'Office Admin owns the Brand Profile, external-email switch, exceptions, and missing office information.',
    'Project Manager reviews scope, approvals, corrective work, and high-impact queue items.',
    'Superintendent receives field-ready tasks, inspection preparation, photo requirements, and site reminders.',
  ],
  artifacts: ['Workspace Brand Profile','Auto-Pilot entitlement record','Workspace input scan','Agent action queue','Command Inbox Next Step cards','Cost discrepancy summary','Owner-visible automation log'],
  limitations: [
    'The agent reads records already inside The Command Suite; it does not connect directly to a mailbox, accounting system, or government portal without a separately verified connector.',
    'Permit, inspection, and closeout packets are prepared for review. The agent does not sign, certify, or submit to a jurisdiction.',
    'External email is disabled by default and cannot be used without an active paid add-on plus a workspace-owner opt-in.',
    'Unknown, missing, contradictory, financial, contractual, or jurisdiction-sensitive facts are stopped for human review instead of guessed.',
  ],
  publishingNotes: ['Protected workspace route','Company-scoped server queries','$1,800/month add-on entitlement; disabled by default','Existing trial boundary remains enforced','Private staging only until explicit publishing approval'],
} as const;

export type BrandProfileInput = {
  companyName:string;logoUrl:string;primaryColor:string;accentColor:string;toneOfVoice:string;communicationStyle:string;
  emailTemplates:string;packetTemplates:string;workflowPreferences:string;vendorPreferences:string;compliancePreferences:string;
  closeoutPacketStyle:string;inspectionPacketStyle:string;permitPacketStyle:string;
};
