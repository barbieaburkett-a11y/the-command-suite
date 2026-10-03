export type WorkflowTemplate={key:string;name:string;purpose:string;trigger:string;steps:string[];roles:string[];artifacts:string[];fields:{key:string;label:string;placeholder:string;multiline?:boolean}[]};

export const workflowTemplates:WorkflowTemplate[]=[
  {key:'permit',name:'Permit Workflow',purpose:'Move a permit from need identified to approved and logged with no gaps.',trigger:'New job awarded or scope change requiring a permit.',steps:[
    'Identify permit types: building, electrical, plumbing, mechanical, or specialty.',
    'Confirm the jurisdiction profile: city, county, state, portal, submission method, fees, and timelines.',
    'Complete the requirements checklist for plans, specs, forms, licenses, insurance, signatures, and supporting documents.',
    'Assemble the permit packet: application, drawings, supporting documents, and internal review sign-off.',
    'Complete internal review and approval of scope, valuation, and drawings.',
    'Submit through the official portal or in person; log the submission date and reference number.',
    'Track status as pending, clarification requested, approved, or rejected.',
    'Route comments, revise, resubmit, and log each review cycle.',
    'Save the approved permit, conditions, and inspection requirements to the job record.',
    'Notify field and office of permit details, conditions, and inspection triggers.'
  ],roles:['Project manager','Office administrator','Estimator','Superintendent / foreman'],artifacts:['Permit requirements checklist','Permit packet template','Status board','Comment log'],fields:[
    {key:'permitTypes',label:'Permit types',placeholder:'Building, electrical, plumbing…'},
    {key:'jurisdiction',label:'Jurisdiction and official source',placeholder:'City/county, portal URL, submission method'},
    {key:'reference',label:'Submission reference',placeholder:'Reference number and submission date'},
    {key:'conditions',label:'Conditions and comments',placeholder:'Reviewer comments, conditions, resubmittal history',multiline:true}
  ]},
  {key:'inspection',name:'Inspection Workflow',purpose:'Ensure required inspections are scheduled, passed, and documented.',trigger:'Permit condition or construction milestone reached.',steps:[
    'Map required inspections from the permit: footing, framing, rough-in, final, and specialty.',
    'Tie each inspection to a task in the project schedule.',
    'Request the inspection through the jurisdiction portal or phone; log confirmation.',
    'Prepare the site for access, safety, completed work, and required documents.',
    'Attend the inspection and capture notes and photos.',
    'Record the result: pass, conditional pass, or fail, with reasons.',
    'Assign corrective actions and deadlines; request reinspection when needed.',
    'Store inspection reports and results in the job record and compliance pack.'
  ],roles:['Superintendent / foreman','Project manager','Office administrator'],artifacts:['Inspection checklist','Inspection request log','Inspection result log','Photo record'],fields:[
    {key:'inspectionType',label:'Inspection and milestone',placeholder:'Framing inspection after rough-in'},
    {key:'request',label:'Request confirmation',placeholder:'Requested date, time, confirmation number'},
    {key:'result',label:'Result',placeholder:'Pass, conditional pass, or fail'},
    {key:'corrections',label:'Corrections and next action',placeholder:'Owner, deadline, and reinspection plan',multiline:true}
  ]},
  {key:'job-record',name:'Job Record Workflow',purpose:'Keep a single source of truth for each job.',trigger:'Job awarded.',steps:[
    'Create the job record with a unique job ID, client, location, scope, and contract value.',
    'Attach the contract, plans, specs, permits, insurance, and key contacts.',
    'Set sections for permits, inspections, RFIs, change orders, daily logs, photos, and invoices.',
    'Assign the project manager, office administrator, superintendent, and accounting contact.',
    'Define which permits, inspections, change orders, and major communications must be logged.',
    'At closeout, verify every section is complete and archive the job record.'
  ],roles:['Project manager','Office administrator','Superintendent','Accounting'],artifacts:['Job record template','Section structure','Ownership matrix'],fields:[
    {key:'jobId',label:'Job ID and contract value',placeholder:'2314 · $185,000'},
    {key:'scope',label:'Scope summary',placeholder:'Contracted work and exclusions',multiline:true},
    {key:'owners',label:'Workflow owners',placeholder:'PM, office, field, accounting'},
    {key:'requiredLogs',label:'Required job logs',placeholder:'What must be recorded and by whom',multiline:true}
  ]},
  {key:'crew-office',name:'Crew to Office Communication Workflow',purpose:'Make field-to-office communication structured, not random.',trigger:'Any field issue, update, or request.',steps:[
    'Use one primary communication channel: app form, email template, or portal.',
    'Choose the request type: material, schedule, inspection, change, safety, or client concern.',
    'Include job ID, location, issue type, description, photos, and urgency.',
    'Office triages the request and assigns an owner and due date.',
    'Office replies with the decision, next steps, and timing.',
    'Log the request and resolution in the job record.'
  ],roles:['Foreman / superintendent','Office administrator','Project manager'],artifacts:['Standard request form','Triage log','Response log'],fields:[
    {key:'requestType',label:'Request type and urgency',placeholder:'Material need · high'},
    {key:'issue',label:'Field issue or request',placeholder:'What happened and what is needed',multiline:true},
    {key:'ownerDue',label:'Office owner and due date',placeholder:'Maria · September 26'},
    {key:'response',label:'Decision and next steps',placeholder:'Decision, action, and timing',multiline:true}
  ]},
  {key:'change-order',name:'Change Order Workflow',purpose:'Control scope, cost, and documentation.',trigger:'Scope change requested by client, jurisdiction, or internal need.',steps:[
    'Capture who requested the change, what changed, why, and when.',
    'Analyze cost, schedule, labor, materials, and risk impact.',
    'Draft the change order with description, pricing, time impact, and updated contract value.',
    'Obtain owner or project manager approval before sending it to the client.',
    'Send the change order for client signature or written acceptance.',
    'Store the approved change order in the job record.',
    'Update the schedule and budget.',
    'Notify field and subcontractors with the approved scope and drawings.'
  ],roles:['Project manager','Owner','Office administrator','Superintendent','Subcontractors'],artifacts:['Change request form','Impact analysis template','Change order document','Updated schedule and budget'],fields:[
    {key:'request',label:'Requested change',placeholder:'Who, what, why, and when',multiline:true},
    {key:'impact',label:'Cost, schedule, and risk impact',placeholder:'Labor, materials, time, risk',multiline:true},
    {key:'approval',label:'Internal and client approval',placeholder:'Approver, method, and date'},
    {key:'fieldNotice',label:'Field notification',placeholder:'Who was notified and which drawings changed'}
  ]},
  {key:'closeout',name:'Closeout Workflow',purpose:'Finish jobs cleanly and ready for audit.',trigger:'Substantial completion reached.',steps:[
    'Create the punch list, assign items, and track completion.',
    'Confirm all required inspections passed and are documented.',
    'Compile final drawings, warranties, manuals, test reports, and as-builts.',
    'Complete final invoice, retainage, lien waivers, and reconciliations.',
    'Deliver the closeout package and complete the client walk-through.',
    'Archive the complete job record for future reference and claims.'
  ],roles:['Project manager','Superintendent','Office administrator','Accounting'],artifacts:['Punch list template','Closeout checklist','As-built package','Financial closeout checklist'],fields:[
    {key:'punch',label:'Open punch items',placeholder:'Item, owner, due date',multiline:true},
    {key:'documents',label:'Closeout documents',placeholder:'Warranties, manuals, as-builts, test reports',multiline:true},
    {key:'financial',label:'Financial closeout',placeholder:'Invoice, retainage, lien waivers, reconciliation'},
    {key:'handoff',label:'Client handoff',placeholder:'Walk-through date and package delivery'}
  ]},
  {key:'documentation',name:'Documentation Workflow',purpose:'Keep documents complete, consistent, and findable.',trigger:'Any new document created or received.',steps:[
    'Name the file JobID_Type_Date_Version, such as 2314_PERMIT_2026-09-24_v1.',
    'Store it in the correct job folder and subfolder.',
    'Mark superseded versions and keep the latest version primary.',
    'Apply access rules for viewing and editing compliance and financial documents.',
    'Audit jobs periodically for missing or misfiled documents.'
  ],roles:['Office administrator','Project manager','Document control'],artifacts:['Naming convention guide','Folder structure map','Version control rules','Audit checklist'],fields:[
    {key:'fileName',label:'Approved file name',placeholder:'2314_PERMIT_2026-09-24_v1'},
    {key:'location',label:'Job folder and section',placeholder:'2314 / Permits / Approved'},
    {key:'version',label:'Version status',placeholder:'Current or superseded by…'},
    {key:'access',label:'Access and audit notes',placeholder:'Who may view/edit; missing items',multiline:true}
  ]},
  {key:'customer-update',name:'Customer Update Workflow',purpose:'Keep clients informed without chaos.',trigger:'Milestone reached, delay, change, or client request.',steps:[
    'Set a weekly or milestone-based update cadence.',
    'Prepare progress, upcoming work, risks, decisions needed, and photos.',
    'Deliver the update by email, portal, or meeting summary.',
    'Log the update in the job record.',
    'For major issues, schedule a call and document decisions and agreements.'
  ],roles:['Project manager','Office administrator','Client representative'],artifacts:['Customer update template','Communication log','Decision log'],fields:[
    {key:'progress',label:'Progress completed',placeholder:'What changed since the last update',multiline:true},
    {key:'upcoming',label:'Upcoming work',placeholder:'Next work and dates',multiline:true},
    {key:'risks',label:'Risks and decisions needed',placeholder:'Issue, owner, response date',multiline:true},
    {key:'delivery',label:'Delivery and client response',placeholder:'Method, date, response, decisions'}
  ]},
  {key:'subcontractor',name:'Subcontractor Workflow',purpose:'Keep subcontractors aligned, compliant, and on schedule.',trigger:'Subcontract awarded or subcontractor mobilized.',steps:[
    'Onboard the subcontractor with scope, schedule, site rules, safety, and documentation requirements.',
    'Verify licenses, insurance, W-9, contracts, and safety certifications.',
    'Issue work orders or releases tied to schedule tasks.',
    'Collect daily or weekly progress, issue, and manpower reports.',
    'Document regular quality and safety checks.',
    'Tie payment approval to milestones, required documents, and approvals.'
  ],roles:['Project manager','Office administrator','Superintendent','Subcontractors'],artifacts:['Subcontractor onboarding checklist','Compliance checklist','Work order template','Subcontractor reporting template','Payment approval checklist'],fields:[
    {key:'sub',label:'Subcontractor and scope',placeholder:'Company, trade, contract scope'},
    {key:'compliance',label:'Compliance status',placeholder:'License, COI, W-9, contract, safety'},
    {key:'reporting',label:'Reporting cadence',placeholder:'Daily/weekly, contact, required fields'},
    {key:'payment',label:'Payment approval requirements',placeholder:'Milestone, documents, approver'}
  ]},
  {key:'daily-log',name:'Daily Log Workflow',purpose:'Capture what actually happened on site each day.',trigger:'End of each workday.',steps:[
    'Record weather, crews, work performed, equipment, deliveries, and visitors.',
    'Record delays, safety events, RFIs, and possible change triggers.',
    'Attach photos of key work areas, issues, and progress.',
    'Foreman or superintendent submits the log through the app or portal.',
    'Office reviews, flags issues, and stores the log in the job record.'
  ],roles:['Foreman / superintendent','Office administrator','Project manager'],artifacts:['Daily log template','Photo record','Issue flagging system'],fields:[
    {key:'conditions',label:'Weather, crews, and equipment',placeholder:'Conditions and manpower',multiline:true},
    {key:'work',label:'Work performed and deliveries',placeholder:'Completed work and deliveries',multiline:true},
    {key:'issues',label:'Issues, incidents, and change triggers',placeholder:'Delay, safety, RFI, or possible change',multiline:true},
    {key:'review',label:'Office review and flags',placeholder:'Reviewer, flags, owner, due date'}
  ]}
];

export const workflowTemplateMap=Object.fromEntries(workflowTemplates.map(template=>[template.key,template])) as Record<string,WorkflowTemplate>;
