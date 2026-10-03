import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import { publicMarketing } from '../public-marketing';

export const metadata={title:'14-Day Contractor CRM Trial | The Command Suite',description:'Create a private contractor CRM workspace and use Command Inbox to turn field updates into organized job records. No credit card at signup.',robots:{index:false,follow:false}};

const steps=[
  ['01','Create your company workspace','Open the private CRM account for your contractor company and invite only the Team Members you authorize.'],
  ['02','Set up Command Inbox','Choose the field-to-office handoff you want to organize first.'],
  ['03','Add or import a customer and job','Connect the people, project, scheduled work, and documents in one job record.'],
  ['04','Capture a field update','Bring in a text, voice note, photo, receipt, or job update through Command Inbox.'],
  ['05','Review the organized record','Identify missing information, clarify the details, and approve the record before it moves forward.'],
  ['06','Continue from the CRM dashboard','Keep the next office action connected to the customer, job, schedule, files, and team.'],
] as const;

export default function TrialPage(){return <MarketingShell><main id="main-content" className="tf-page">
  <section className="tf-trial-hero"><div className="os-wrap tf-trial-grid"><div><div className="os-kicker">14 days · contractor CRM · no credit card</div><h1>The Command Suite is a contractor CRM with Command Inbox built in.</h1><p className="tf-display-copy">Create one private Company Workspace and see how the updates your crew already sends become organized records your office can use.</p><ul className="tf-checks"><li>Organize customers, leads, jobs, schedules, and documents</li><li>Capture texts, voice notes, photos, receipts, and job updates</li><li>Identify missing information and approve the record before it moves forward</li><li>Keep office work together inside The Command Suite</li></ul><div className="tf-promise"><b>No surprise billing.</b><span>{publicMarketing.offer.confirmation}</span></div></div><div className="tf-form"><div className="tf-form-head"><span>Founding Partner guided trial</span><h2>Create your company workspace securely.</h2><p>A Company Workspace is your contractor company’s private CRM account. One signup creates the workspace and its owner account.</p></div><Link className="os-button" href="/signup">Create My Company Workspace →</Link><p className="tf-terms">No card. No automatic charge. Your crew does not need a ChatGPT account.</p></div></div></section>
  <section className="tf-section"><div className="os-wrap"><div className="tf-section-head"><span>Your first six steps</span><h2>From signup to one organized job record.</h2><p>Start with a real field update, keep the original information connected to the job, and continue the work from the CRM dashboard.</p></div><div className="tf-day-grid">{steps.map(([label,title,detail])=><article key={label}><b>{label}</b><h3>{title}</h3><p>{detail}</p></article>)}</div><div className="os-callout"><strong>Why we call customers partners</strong><p>{publicMarketing.partnerExplanation}</p><p>A Founding Partner is a paying contractor company that helps shape the product through honest feedback. Team Members are authorized company users; Trade Partners are subcontractors or vendors; Referral Partners are people or companies referring business.</p></div></div></section>
</main></MarketingShell>}
