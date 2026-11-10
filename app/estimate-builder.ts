export const estimateUnits = ['EA', 'LF', 'SF', 'SY', 'CY', 'TON', 'LS', 'HR', 'DAY', 'SQ', 'GAL', 'LB'] as const;
export type EstimateUnit = typeof estimateUnits[number];

export const estimateSections = [
  'General Requirements',
  'Sitework & Earthwork',
  'Concrete',
  'Masonry',
  'Metals',
  'Wood & Carpentry',
  'Thermal & Moisture Protection',
  'Doors & Windows',
  'Finishes',
  'Specialties',
  'Equipment',
  'Plumbing',
  'HVAC',
  'Electrical',
  'Exterior Improvements',
  'Utilities',
] as const;

export const estimateStatuses = ['draft', 'sent', 'approved', 'won', 'lost', 'void'] as const;
export type EstimateStatus = typeof estimateStatuses[number];

export const estimateBuilderModule = {
  name: 'Estimate Builder',
  purpose: 'Build an estimate from the company price library and reusable assemblies instead of a blank page, price it with the contractor\'s own numbers, and turn a win into a job without re-typing.',
  trigger: 'The office prices new work, assembles a bid from repeatable chunks, sends a client-ready estimate, or converts an approved estimate into a project.',
  roles: [
    'Office Admin maintains the line-item library and assemblies, and keeps sample prices replaced with company prices.',
    'Estimator builds the worksheet, confirms every line, applies markup and tax, and produces the client PDF.',
    'Owner approves the estimate before it is sent and marks the win so the job is created.',
  ],
  artifacts: [
    'Workspace line-item library with labor / material / equipment split',
    'Reusable assemblies and templates, including civil and sitework chunks',
    'Estimate worksheet with division subtotals, markup, tax, and alternates',
    'Client-ready estimate PDF',
    'Project created from a won estimate',
  ],
  limitations: [
    'Estimate Builder prices work from the contractor\'s own library; it does not read plans, measure drawings, or pull live supplier pricing.',
    'Lines added from an assembly start unconfirmed and must be confirmed by a person before the estimate can be sent or approved.',
    'Sample library items and assemblies are illustrative starting points with placeholder prices; they are labeled as samples until the company replaces them.',
    'A won estimate creates the project record; scheduling, invoicing, and payments stay in their existing modules.',
  ],
  publishingNotes: [
    'Protected workspace route',
    'Company-scoped server queries',
    'Existing 14-day trial and entitlement rules apply',
    'Private staging only until explicit approval to publish',
  ],
} as const;

// Generic sample library. Every price below is a round placeholder chosen for
// illustration only; rows are stored with is_sample = 1 and labeled "Sample" in
// the product until the contractor replaces them with their own pricing.
// Tuple: [sampleKey, description, section, unit, unitPriceCents, laborCents, materialCents, equipmentCents]
export const starterEstimateItems: ReadonlyArray<readonly [string, string, string, EstimateUnit, number, number, number, number]> = [
  ['sample-mobilization', 'Mobilization and site setup', 'General Requirements', 'LS', 85000, 30000, 5000, 50000],
  ['sample-general-labor', 'General labor', 'General Requirements', 'HR', 6500, 6500, 0, 0],
  ['sample-bulk-excavation', 'Bulk excavation, machine dug', 'Sitework & Earthwork', 'CY', 1850, 620, 0, 1230],
  ['sample-haul-off', 'Haul off and dispose of excess soil', 'Sitework & Earthwork', 'CY', 2400, 500, 0, 1900],
  ['sample-topsoil', 'Topsoil, spread and graded', 'Sitework & Earthwork', 'CY', 3200, 1400, 1800, 0],
  ['sample-stone-base', 'Crushed stone base, compacted, per ton placed', 'Sitework & Earthwork', 'TON', 4600, 1200, 2900, 500],
  ['sample-pipe-bedding', 'Pipe bedding gravel', 'Sitework & Earthwork', 'TON', 4400, 900, 3000, 500],
  ['sample-sod', 'Sod, supplied and laid', 'Exterior Improvements', 'SF', 185, 85, 100, 0],
  ['sample-concrete-slab', 'Concrete slab on grade, 4 in, 3000 psi', 'Concrete', 'SF', 875, 325, 475, 75],
  ['sample-concrete-footing', 'Concrete footing, formed and poured', 'Concrete', 'LF', 4200, 1800, 2100, 300],
  ['sample-rebar', 'Reinforcing steel, installed', 'Concrete', 'LB', 210, 95, 115, 0],
  ['sample-pipe-water-6', 'Water line, 6 in, installed with standard fittings', 'Utilities', 'LF', 5400, 2100, 2900, 400],
  ['sample-pipe-pvc-6', 'PVC pipe, 6 in, laid and bedded', 'Utilities', 'LF', 3850, 1600, 1950, 300],
  ['sample-bath-rough-in', 'Bathroom rough-in, per fixture', 'Plumbing', 'EA', 95000, 42000, 53000, 0],
];

// Generic sample assemblies. Lines reference starter items by sample key and
// carry per-one-unit-of-assembly quantities.
// Tuple: [sampleKey, name, description, unit, lines: [itemSampleKey, quantityPerUnit]]
export const starterEstimateAssemblies: ReadonlyArray<readonly [string, string, string, EstimateUnit, ReadonlyArray<readonly [string, number]>]> = [
  ['sample-slab-on-grade', 'Slab on Grade', 'Sample assembly: one square foot of 4 in slab on a compacted stone base with light reinforcing.', 'SF', [
    ['sample-concrete-slab', 1],
    ['sample-stone-base', 0.06],
    ['sample-rebar', 0.5],
  ]],
  ['sample-earthwork-cy', 'Earthwork — Excavate and Haul', 'Sample assembly: one cubic yard excavated, hauled off, and disposed.', 'CY', [
    ['sample-bulk-excavation', 1],
    ['sample-haul-off', 1],
  ]],
  ['sample-pipe-run-lf', 'Pipe Run — 6 in Water Line', 'Sample assembly: one linear foot of 6 in water line on gravel bedding.', 'LF', [
    ['sample-pipe-water-6', 1],
    ['sample-pipe-bedding', 0.08],
  ]],
  ['sample-stone-base-ton', 'Stone Base Placement', 'Sample assembly: one ton of crushed stone base placed and compacted.', 'TON', [
    ['sample-stone-base', 1],
  ]],
  ['sample-bathroom-rough-in', 'Bathroom Rough-In Package', 'Sample assembly: rough-in for one three-fixture bathroom (toilet, lavatory, tub or shower).', 'EA', [
    ['sample-bath-rough-in', 3],
    ['sample-general-labor', 2],
  ]],
];
