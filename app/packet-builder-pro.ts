export const packetTypes=[
  {key:'permit',name:'Permit Packet',purpose:'Organize verified permit requirements, job records, and review-ready supporting material.'},
  {key:'inspection',name:'Inspection Packet',purpose:'Prepare the inspection checklist, field evidence, and current job status for human review.'},
  {key:'closeout',name:'Closeout Packet',purpose:'Assemble completed work, approvals, files, financial summary, and final next actions.'},
  {key:'warranty',name:'Warranty Packet',purpose:'Collect warranty contacts, vendor references, approved work, and customer-ready handoff notes.'},
  {key:'customer_summary',name:'Customer Summary',purpose:'Create a concise customer-facing summary from approved job records and milestones.'},
  {key:'vendor_summary',name:'Vendor Summary',purpose:'Summarize assigned vendors, scopes, contact records, and cost allocation.'},
  {key:'compliance',name:'Compliance Packet',purpose:'Assemble compliance modules, checklist completion, source records, and exceptions.'},
  {key:'job_financial_summary',name:'Job Financial Summary',purpose:'Summarize verified cost codes, budget, actual cost, documents, and QuickBooks mappings.'},
] as const;
export type PacketType=typeof packetTypes[number]['key'];
export const packetTypeMap=Object.fromEntries(packetTypes.map(item=>[item.key,item])) as Record<PacketType,typeof packetTypes[number]>;
export const packetBuilderModule={
  name:'Module V — Packet Builder Pro',
  purpose:'Build review-ready job packets from protected company records without re-entering the same information.',
  roles:['Office Admin — builds, reviews, and exports','PM — confirms job, financial, and workflow details','Superintendent — confirms field evidence and inspection or closeout details'],
  artifacts:['Saved packet record','Smart section drafts','Source snapshot','Review status','Protected PDF export','Export audit record'],
  integrationPoints:['Module S cost codes and job costing','Module T verified QuickBooks mappings and financial snapshots','Module U Auto-Pilot suggestions','Jobs, workflows, vendors, compliance, Command Inbox, and field updates'],
  limitations:['Generated copy is a draft and requires human review.','The module does not submit documents to a government portal.','QuickBooks data is included only when a verified workspace connection and cached mapping exist.','PDF exports remain protected and are generated only for an authorized workspace member.'],
  publishingNotes:['Private staging only.','No public route, public file URL, or production navigation entry is created.'],
} as const;
