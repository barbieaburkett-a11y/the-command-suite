export const projectTypeSelectorModule = {
  name: 'Module P — Project Type Selector',
  purpose: 'Use one protected project classification across lead intake, job setup, workflows, compliance preparation, and Modules K–O.',
  trigger: 'A workspace user creates or classifies a lead or job.',
  roles: ['Office Admin', 'Project Manager', 'Superintendent'],
  artifacts: ['Lead classification', 'Job classification', 'Workflow assignment', 'Compliance defaults', 'Automation log context'],
  integrationPoints: ['Lead engine', 'Job engine', 'Workflow engine', 'Compliance engine', 'Jurisdiction engine', 'Modules K–O'],
  limitations: ['Project type supplies internal defaults; it does not determine official jurisdiction requirements.','A verified jurisdiction source and human review remain required before permit or inspection action.','The selector does not submit forms, schedule inspections, change pricing, or unlock Bundles.'],
  publishingNotes: ['Private staging only', 'Protected workspace route', 'No production publishing without explicit approval'],
} as const;
