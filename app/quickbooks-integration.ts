export const quickBooksModule={
  name:'Module T — QuickBooks Integration',
  purpose:'Connect approved company financial records to one QuickBooks Online company without weakening workspace isolation or exposing accounting credentials.',
  trigger:'A workspace owner activates the premium add-on, connects QuickBooks, confirms account mappings, and starts a protected sync.',
  roles:['Office Admin owns the connection, account mappings, conflicts, and sync approvals.','Project Manager reviews job-cost, estimate, proposal, and invoice mappings.','Superintendent does not receive QuickBooks credentials or unrestricted accounting reports.'],
  artifacts:['Encrypted workspace connection','Chart of Accounts cache','Partner mapping overrides','Entity sync ledger','Conflict review record','Financial report cache','Internal refund draft','QuickBooks audit run'],
  limitations:['An Intuit developer application and registered callback URL are required before a real company can connect.','QuickBooks remains the accounting system of record after connection; The Command Suite never invents balances or bypasses QuickBooks validation.','Cost codes are mapped to QuickBooks accounts and products/services because QuickBooks Online does not provide a native Command Suite cost-code object.','Refunds remain internal review drafts until a separately approved refund workflow is implemented.'],
  publishingNotes:['Protected workspace route','Premium add-on entitlement; disabled by default','Tokens encrypted at rest and never returned to the browser','Existing 14-day trial and module entitlements remain enforced','Private staging only until explicit publishing approval'],
} as const;

export const quickBooksSyncGroups=[
  ['Chart of Accounts','Pull accounts and prepare category, subcategory, and cost-code mappings.'],
  ['Cost codes','Map active Module S codes to QuickBooks accounts and products/services.'],
  ['Customers','Detect duplicates, push approved records, pull QuickBooks customers, and hold conflicts.'],
  ['Vendors','Detect duplicates, push approved records, pull QuickBooks vendors, and preserve cost-code references.'],
  ['Invoices & payments','Push mapped invoices and lines; pull payment and status updates including partial payments.'],
  ['Estimates & proposals','Push estimates; represent approved proposals as clearly labeled QuickBooks estimates.'],
  ['Job costing','Compare labor, material, subcontractor, vendor, budget, and actual summaries.'],
  ['Financial reports','Cache protected QuickBooks reports for workspace and job-level review.'],
] as const;
