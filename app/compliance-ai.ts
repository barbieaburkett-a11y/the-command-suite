export const complianceCategories=[
  {key:'permit',label:'Permit',description:'Applications, forms, supporting documents, approvals, and permit dependencies.'},
  {key:'inspection',label:'Inspection',description:'Site readiness, photos, documents, verification, and inspector-facing preparation.'},
  {key:'safety',label:'Safety',description:'Job-specific safety evidence, responsible roles, and work-ready controls.'},
  {key:'closeout',label:'Closeout',description:'Final approvals, proof, customer deliverables, and completion dependencies.'},
  {key:'warranty',label:'Warranty',description:'Warranty records, vendor references, customer handoff, and retained proof.'},
] as const;
export type ComplianceAICategory=typeof complianceCategories[number]['key'];
export const complianceAudiences=[
  {key:'internal',label:'Internal team'},
  {key:'inspector',label:'Inspector'},
  {key:'permit_office',label:'Permit office'},
  {key:'customer',label:'Customer'},
  {key:'vendor',label:'Vendor'},
  {key:'closeout',label:'Closeout review'},
] as const;
export const complianceAIModule={
  name:'Module X — Compliance AI',
  purpose:'Detect, organize, score, and explain job compliance from protected company records before permit, inspection, scheduling, and closeout decisions are made.',
  roles:[
    'Office Admin — maintains requirements, documents, official sources, forms, and review status.',
    'Project Manager — resolves dependencies, approves exceptions, assigns costs, and confirms readiness.',
    'Superintendent — supplies field evidence, photos, verification, safety facts, and inspection readiness.',
  ],
  artifacts:[
    'Versioned compliance template and job item','Requirement and dependency record','Readiness score and missing-item report','Audience-specific summary draft','Internal notification draft','Compliance cost and QuickBooks review record','Packet Builder source section',
  ],
  integrationPoints:[
    'Jobs and Workflow Playbooks','Vendors, inspectors, and customers','Module S cost codes and job financial summaries','Module T protected QuickBooks mapping review','Module V compliance, permit, inspection, closeout, warranty, and financial packets','Module W scheduling blockers and delays','Module U issue detection, escalation, summaries, and packet preparation',
  ],
  limitations:[
    'Generated summaries are structured drafts and require human review.','The module organizes company records; it does not interpret law, guarantee compliance, or replace the authority having jurisdiction.','It does not submit permits, request inspections, send external messages, or post costs to QuickBooks without the separate verified and approved action.','Private vendor, inspector, customer, dependency, and cost records are never exposed publicly.',
  ],
  publishingNotes:['Protected staging only.','No production navigation, public route, or externally delivered draft is created.'],
} as const;
