import Link from 'next/link';
import MarketingShell from '../MarketingShell';

export const metadata={title:'Contractor Resources | The Command Suite',description:'Free contractor paperwork checklist and practical guides to daily logs, change orders, receipts, job photos, and field intake.',alternates:{canonical:'https://thecommandsuite.com/resources'}};

const links=[
  ['Free Paperwork Leak Check','Score ten common field-to-office handoffs. Works without signup.','/free-contractor-paperwork-checklist'],
  ['Daily logs','Make the source, crew, work date, and next action easier to find.','/contractor-daily-logs'],
  ['Change orders','Track the original request, missing cost or schedule detail, and approval.','/construction-change-orders'],
  ['Receipt capture','Keep a receipt and its job context together before accounting review.','/contractor-receipt-capture'],
  ['Jobsite photos','File photos with the right job and a useful description.','/jobsite-photo-documentation'],
  ['JobTread field intake','Understand the assisted handoff options without assuming native integration.','/jobtread-field-intake'],
] as const;

export default function ResourcesPage(){return <MarketingShell><main className="os-subpage" id="main-content"><div className="os-wrap"><div className="os-kicker">Contractor resources</div><h1>Make the paperwork easier to control.</h1><p className="os-lead">Useful tools and practical examples. These guides do not claim a particular customer outcome or a feature that is not available in the pilot.</p><div className="os-subgrid">{links.map(([title,detail,path])=><article className="os-subcard" key={path}><h2>{title}</h2><p>{detail}</p><Link href={path}>Open resource →</Link></article>)}</div></div></main></MarketingShell>}
