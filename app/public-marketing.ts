export const publicMarketing = {
  productName: 'The Command Suite',
  description:
    'The Command Suite is the contractor CRM that turns field updates into organized job records. Manage customers, jobs, schedules, files, approvals and office follow-up from one connected workspace.',
  coreWorkflow: ['Capture', 'Organize', 'Clarify', 'Approve', 'Route'] as const,
  primaryFeature:
    'Command Inbox turns the updates your crew already sends into organized records inside your CRM.',
  supportingCopy:
    'Capture texts, voice notes, photos, receipts and job updates through Command Inbox, then keep the organized information connected to the customer, job, schedule, files and office dashboard.',
  offer: {
    name: '14-Day Guided Founding Trial',
    noCard: 'No credit card at signup.',
    guidedSetup: 'One real contractor workflow is configured during the trial.',
    introductoryPrice: '$149 per month after the 14-day free trial.',
    ongoingPrice: 'One flat price, no tiers.',
    confirmation: 'Pricing and billing terms are confirmed before payment.',
    audience: 'Founding Partners',
  },
  ctas: {
    primary: { label: 'Start My 14-Day Guided Trial', href: '/trial' },
    secondary: { label: 'See How It Works', href: '/how-it-works' },
    customer: { label: 'Customer Login', href: '/login' },
  },
  footerDescription: 'One update. One organized job flow. Human approval stays in control.',
  permitDisclaimer:
    'Government sources remain authoritative. The Command Suite does not file applications, interpret code, monitor government portals, schedule inspections, or guarantee approvals.',
  positioning:
    'Replace scattered spreadsheets, disconnected apps and unfinished office handoffs with one contractor CRM built around the job.',
  accountingClarification:
    'Run your customers, jobs and field-to-office workflow inside The Command Suite while keeping your approved accounting system for bookkeeping, payroll and tax reporting.',
  partnerExplanation:
    'The Command Suite is being built alongside contractors—not simply sold to them. Founding Partners receive guided support and are encouraged to provide honest feedback that helps shape the product.',
} as const;

export const availableNow = [
  ['Company Workspace and dashboard', 'A private CRM account with company-scoped records and an office dashboard.'],
  ['Leads, customers and contacts', 'Keep lead and customer details connected to the correct work.'],
  ['Jobs and job stages', 'Track the job, stage, scheduled date, next action, and linked records.'],
  ['Command Inbox', 'Turn crew updates into organized records inside the CRM while preserving the source.'],
  ['Crew links and field updates', 'Give the crew a job-specific way to type or speak an update and attach files.'],
  ['Photos, files and attachments', 'Keep supported photos and documents with their source record.'],
  ['Human approvals', 'Review consequential records before an office handoff.'],
  ['Schedule and scheduled job dates', 'Keep scheduled dates and next actions connected to the job.'],
  ['Office handoffs and exports', 'Prepare reviewed information for an agreed export or assisted destination.'],
  ['Permit Pathfinder', 'Find selected official jurisdiction resources and keep permit tracking connected to the job.'],
  ['Authentication and company separation', 'Protect each Company Workspace and keep its records separated from other companies.'],
] as const;

export const guidedSetup = [
  ['Workflow mapping', 'Define one real field-to-office handoff and the record it should create.'],
  ['Approval configuration', 'Confirm who reviews the record and what must be complete first.'],
  ['Destination and export setup', 'Configure the agreed CSV, email, or assisted handoff.'],
  ['Selected system handoffs', 'Scope accounting or project-system handoffs without implying a native integration.'],
] as const;

export const comingNext = [
  'Estimating and proposals',
  'Dispatch and advanced scheduling',
  'Invoicing and payments',
  'Broader workflow automation',
] as const;

export const homepageFaq = [
  { question: 'What is The Command Suite?', answer: 'It is a contractor CRM and operating workspace that keeps leads, customers, jobs, field updates, schedules, files, approvals, and office follow-up connected.' },
  { question: 'Does the crew need to learn another field app?', answer: 'No. A crew member can use a job-specific link to type or speak an update and attach supported files while the office works from the private workspace.' },
  { question: 'Does it replace QuickBooks?', answer: 'The Command Suite is the CRM for your customers, jobs, field-to-office workflow, schedules, files, and approvals. Keep your approved accounting system for bookkeeping, payroll, and tax reporting.' },
  { question: 'Does Permit Pathfinder submit permits?', answer: 'No. Permit Pathfinder links to selected official jurisdiction resources and helps keep permit information organized with the job. Government sources remain authoritative.' },
  { question: 'What happens after the 14-day trial?', answer: 'Pricing and billing terms are confirmed before payment. The Command Suite is $149 per month after the 14-day free trial.' },
  { question: 'Why do you call customers Founding Partners?', answer: 'The Command Suite is being built alongside contractors—not simply sold to them. Founding Partners receive guided support and are encouraged to provide honest feedback that helps shape the product. The term does not create a legal partnership, joint venture, agency, or fiduciary relationship.' },
] as const;
