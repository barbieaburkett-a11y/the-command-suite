export type TierKey='starter'|'standard'|'premium'|'enterprise';
export type ModuleKey='workflow-playbooks'|'compliance-pack'|'jurisdiction-library'|'command-inbox'|'crew-intake'|'job-management'|'customer-management'|'file-management'|'schedule-management'|'activity-log';
export type TierRole={name:'Office Admin'|'Project Manager'|'Superintendent';duties:string};
export type PricingTier={key:TierKey;name:string;price:string;trialBehavior:string;modules:ModuleKey[];limits:{usage:string;jobs:string;crew:string;storage:string;workflows:string};roles:TierRole[];artifacts:string[];integrationPoints:string[];upgradePath:string;limitations:string[]};

export const moduleNames:Record<ModuleKey,string>={
  'workflow-playbooks':'Workflow Playbooks','compliance-pack':'Compliance Pack','jurisdiction-library':'Jurisdiction Library','command-inbox':'Command Inbox','crew-intake':'Crew Intake','job-management':'Job Management','customer-management':'Customer Management','file-management':'File Management','schedule-management':'Schedule Management','activity-log':'Activity Log',
};
const core:ModuleKey[]=['command-inbox','crew-intake','workflow-playbooks','job-management','customer-management','file-management','schedule-management','activity-log'];
const roles:TierRole[]=[
  {name:'Office Admin',duties:'Maintains customers, jobs, schedules, files, checklists, and office records.'},
  {name:'Project Manager',duties:'Reviews scope, decisions, approvals, exceptions, and the next action.'},
  {name:'Superintendent',duties:'Supplies field facts, photos, voice notes, status, and site proof.'},
];
const commonArtifacts=['Job and customer records','Field updates and source files','Forms and checklists','Printable SOP and audit records'];
const noSubmission='No tier submits applications to a government portal, signs into a jurisdiction system, or guarantees an approval.';
const qualitative='Numeric caps are not yet approved, so the workspace does not invent or silently enforce a number.';
const trial='All modules are available for 14 days. The company trial end date is enforced on the server; no card is automatically charged.';

export const pricingTiers:PricingTier[]=[
  {key:'starter',name:'Starter Tier',price:'$149/month',trialBehavior:trial,modules:core,limits:{usage:'Small contractor usage',jobs:qualitative,crew:qualitative,storage:qualitative,workflows:qualitative},roles,artifacts:commonArtifacts,integrationPoints:['Workspace dashboard','Command Inbox and Crew Intake','Jobs, customers, files, schedule, and activity','Workflow Playbooks'],upgradePath:'Move to Standard when the company needs the job-linked Compliance Pack.',limitations:[noSubmission,'Compliance Pack and the full Jurisdiction Library are not included after the trial.']},
  {key:'standard',name:'Standard Tier',price:'$129/month',trialBehavior:trial,modules:[...core,'compliance-pack'],limits:{usage:'Medium contractor usage',jobs:qualitative,crew:qualitative,storage:qualitative,workflows:qualitative},roles,artifacts:[...commonArtifacts,'Compliance checklists and packet records'],integrationPoints:['Everything in Starter','Compliance Pack','Job-linked permit and inspection records'],upgradePath:'Move to Premium when the company needs the full state, county, and city Jurisdiction Library.',limitations:[noSubmission,'The full Jurisdiction Library is not included after the trial.']},
  {key:'premium',name:'Premium Tier',price:'$179/month',trialBehavior:trial,modules:[...core,'compliance-pack','jurisdiction-library'],limits:{usage:'Large contractor usage',jobs:qualitative,crew:qualitative,storage:qualitative,workflows:qualitative},roles,artifacts:[...commonArtifacts,'Compliance records','Jurisdiction checklists and source references'],integrationPoints:['Everything in Standard','Full Jurisdiction Library','Job-linked permit, correction, and inspection tracking'],upgradePath:'Move to Enterprise when unlimited use, priority support, and multi-company administration are required.',limitations:[noSubmission,'Only jurisdiction entries explicitly marked verified have manually checked official links.']},
  {key:'enterprise',name:'Enterprise Tier',price:'$249/month',trialBehavior:trial,modules:['workflow-playbooks','compliance-pack','jurisdiction-library','command-inbox','crew-intake','job-management','customer-management','file-management','schedule-management','activity-log'],limits:{usage:'Enterprise access',jobs:'Unlimited',crew:'Unlimited',storage:'No application-level numeric cap is configured; infrastructure limits still apply.',workflows:'Unlimited'},roles,artifacts:[...commonArtifacts,'Compliance and jurisdiction records','Enterprise access configuration'],integrationPoints:['All Premium modules','Unlimited job and workflow entitlements','Priority support path','Planned multi-company administration'],upgradePath:'Highest listed tier. Expansion and support scope are confirmed with The Command Suite.',limitations:[noSubmission,'Secure multi-company switching and consolidated administration are planned; the current production-safe boundary remains one primary company workspace per account.','“Unlimited” remains subject to security, acceptable-use, and infrastructure safeguards.']},
];

export const pricingTierMap=Object.fromEntries(pricingTiers.map(tier=>[tier.key,tier])) as Record<TierKey,PricingTier>;
export function normalizeTier(value:unknown):TierKey{return value==='standard'||value==='premium'||value==='enterprise'?value:'starter'}
export function tierHasModule(tier:TierKey,module:ModuleKey){return pricingTierMap[tier].modules.includes(module)}
