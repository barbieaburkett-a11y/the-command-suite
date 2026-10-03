export const costCodeCategories=['Labor','Materials','Equipment','Subcontractors','Fees','Misc'] as const;
export const costCodeUnitTypes=['hours','quantity','lump_sum'] as const;
export type CostCodeCategory=typeof costCodeCategories[number];

export const costCodeModule={
  name:'Module S — Cost Codes',
  purpose:'Give every estimate, invoice, vendor cost, and field expense one consistent financial label so the office can compare budget, actual cost, billed revenue, and payments by job.',
  trigger:'The office builds a cost library, prices work, records a cost, or reviews job profitability.',
  roles:['Office Admin maintains the library, documents payments, and exports summaries.','Project Manager assigns codes, budgets work, and reviews cost discrepancies.','Superintendent uses assigned codes on scheduling and field-cost records.'],
  artifacts:['Workspace cost code library','Job cost assignment','Estimate, proposal, and invoice line item','Budget and actual cost entry','Payment allocation','Job and workspace cost summary','Protected CSV export'],
  limitations:['Module S records and organizes financial information; it does not move money, collect card payments, or perform accounting reconciliation.','QuickBooks mapping fields and protected exports are prepared, but no QuickBooks connection is included.','Auto-Pilot may suggest or summarize cost codes, but external cost emails remain disabled unless the separate Auto-Pilot entitlement and workspace email gate are active.'],
  publishingNotes:['Protected workspace route','Company-scoped server queries','Existing 14-day trial and entitlement rules apply','Private staging only until explicit approval to publish'],
} as const;

export const starterCostCodes=[
  ['01-100','Project Management','Labor','General','Office and project-management time','hours',0,0],
  ['02-100','Site Labor','Labor','General','Field labor not assigned to a specialty trade','hours',0,0],
  ['03-100','Concrete Materials','Materials','Concrete','Concrete, reinforcing, and placement materials','quantity',0,2000],
  ['06-100','Framing Materials','Materials','Framing','Lumber, sheathing, connectors, and framing supplies','quantity',0,2000],
  ['16-100','Electrical Subcontractor','Subcontractors','Electrical','Licensed electrical trade work','lump_sum',0,1500],
  ['22-100','Plumbing Subcontractor','Subcontractors','Plumbing','Licensed plumbing trade work','lump_sum',0,1500],
  ['23-100','HVAC Subcontractor','Subcontractors','HVAC','Heating, ventilation, and air-conditioning trade work','lump_sum',0,1500],
  ['90-100','Permit and Review Fees','Fees','Permits','Jurisdiction fees and third-party plan review','lump_sum',0,0],
] as const;

const suggestions:Record<string,string[]>={electrical:['16-100','90-100'],plumbing:['22-100','90-100'],hvac:['23-100','90-100'],'kitchen-remodel':['02-100','06-100','16-100','22-100'],'bathroom-remodel':['02-100','16-100','22-100'],deck:['02-100','03-100','06-100','90-100'],roofing:['02-100','90-100'],'commercial-interior-upfit':['01-100','16-100','22-100','23-100','90-100']};
export function suggestedCostCodeNumbers(projectTypeKey:string){return suggestions[projectTypeKey]||['01-100','02-100','90-100']}
