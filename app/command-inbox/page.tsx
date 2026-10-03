import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import { publicMarketing } from '../public-marketing';

export const metadata={title:'Command Inbox | The Command Suite Contractor CRM',description:'See how Command Inbox turns the updates a crew already sends into organized records inside the contractor CRM.',alternates:{canonical:'https://thecommandsuite.com/command-inbox'}};

const examples=[
  ['Receipt photo','Job-cost record','Available: preserve the file and original note with a job-linked record; cost coding remains review-gated.'],
  ['Customer scope request','Change-order draft','Available: organize the request, surface missing details, and hold the draft for human approval.'],
  ['Crew progress photos','Daily log and job update','Available: collect job-linked photos and create a reviewable field record.'],
  ['Inspection correction','Permit record and next action','Available with manual tracking; automatic government-portal monitoring is not provided.'],
  ['New customer inquiry','CRM lead','Manual entry is available; automatic classification is coming next.'],
  ['Subcontractor confirmation','Calendar event','Coming next; advanced team calendars are not part of the current guided trial.'],
] as const;

export default function InboxPage(){return <MarketingShell><main className="os-subpage" id="main-content"><div className="os-wrap">
  <div className="os-kicker">Major CRM feature</div><h1>Command Inbox turns the updates your crew already sends into organized records inside your CRM.</h1><p className="os-lead">A crew member can open a job-specific link, type or speak an update, and attach supported photos or documents. The office receives the original source, organized details, missing-information prompts, approval status, and job history in the Company Workspace.</p>
  <div className="os-callout"><strong>{publicMarketing.coreWorkflow.join(' → ')}</strong><p>Capture the original. Organize it with the job. Clarify what is missing. Approve consequential records. Route the reviewed information through the configured handoff.</p></div>
  <div className="os-section-head" style={{marginTop:44}}><h2>One update. The right office record.</h2><p>Each example separates current capability from work that is still planned.</p></div>
  <div className="os-subgrid">{examples.map(([source,result,status])=><article className="os-subcard" key={source}><div className="os-kicker">{source} →</div><h2>{result}</h2><p>{status}</p></article>)}</div>
  <div className="os-action-row"><Link className="os-button" href="/#command-inbox-demo">See the workflow →</Link><Link className="os-button os-button-outline" href={publicMarketing.ctas.primary.href}>{publicMarketing.ctas.primary.label}</Link></div>
</div></main></MarketingShell>}
