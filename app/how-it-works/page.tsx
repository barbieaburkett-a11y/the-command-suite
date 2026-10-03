import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import { publicMarketing } from '../public-marketing';

export const metadata={title:'How the Contractor CRM Works | The Command Suite',description:'See how The Command Suite captures, organizes, clarifies, approves, and keeps contractor job updates connected inside the CRM.',alternates:{canonical:'https://thecommandsuite.com/how-it-works'}};

const steps=[
  ['Capture','The crew types or speaks a job update and can attach supported photos, receipts, or documents.'],
  ['Organize','The original source stays connected while the update is structured in the correct customer and job record.'],
  ['Clarify','Missing price, schedule, scope, or responsibility details are surfaced instead of silently guessed.'],
  ['Approve','An authorized Team Member reviews consequential records before they move forward.'],
  ['Route','The approved record is added to job history and prepared for the configured office handoff.'],
] as const;

export default function HowPage(){return <MarketingShell><main className="os-subpage" id="main-content"><div className="os-wrap">
  <div className="os-kicker">How it works</div><h1>Move a field update into the office without entering it again.</h1><p className="os-lead">The Command Suite starts with the handoff contractors repeat every day: turn an incomplete message, photo, receipt, document, or voice note into a clear job record the office can review.</p>
  <div className="os-subgrid">{steps.map(([name,detail],index)=><article className="os-subcard" key={name}><div className="os-kicker">{String(index+1).padStart(2,'0')} / {name}</div><h2>{name}</h2><p>{detail}</p></article>)}</div>
  <div className="os-callout"><strong>Human approval is intentional.</strong><p>Automation does not bypass review of consequential records. Email, export, accounting, and other handoffs remain unavailable or human-review gated unless they are specifically configured and verified.</p></div>
  <div className="os-callout"><strong>The CRM is the operating workspace.</strong><p>{publicMarketing.positioning}</p><p>{publicMarketing.accountingClarification}</p></div>
  <div className="os-action-row"><Link className="os-button" href={publicMarketing.ctas.primary.href}>{publicMarketing.ctas.primary.label} →</Link><Link className="os-button os-button-outline" href="/product">See what is available</Link></div>
</div></main></MarketingShell>}
