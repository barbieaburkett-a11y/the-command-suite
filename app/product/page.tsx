import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import { availableNow, comingNext, guidedSetup, publicMarketing } from '../public-marketing';

export const metadata={title:'Contractor CRM Product | The Command Suite',description:'See the working contractor CRM, what is available through guided setup, and what is clearly labeled coming next.',alternates:{canonical:'https://thecommandsuite.com/product'}};

function CapabilityGroup({label,items,tone}:{label:string;items:readonly (readonly [string,string])[];tone?:string}){
  return <section><div className="os-section-head"><div className="os-kicker">{label}</div></div><div className="os-subgrid">{items.map(([title,detail])=><article className="os-subcard" key={title}><h2>{title}</h2><p>{detail}</p><span className={`os-status ${tone||''}`}>{label}</span></article>)}</div></section>;
}

export default function ProductPage(){return <MarketingShell><main className="os-subpage" id="main-content"><div className="os-wrap">
  <div className="os-kicker">Product overview</div><h1>The contractor CRM behind every organized job.</h1><p className="os-lead">{publicMarketing.description} Availability is labeled plainly so the working product is never confused with the roadmap.</p>
  <CapabilityGroup label="Available now" items={availableNow}/>
  <CapabilityGroup label="Guided setup" items={guidedSetup} tone="scoped"/>
  <section><div className="os-section-head"><div className="os-kicker">Coming next</div><h2>Built toward a fuller office system—without pretending it is finished.</h2></div><div className="os-subgrid">{comingNext.map(item=><article className="os-subcard" key={item}><h2>{item}</h2><p>Planned capability. It is not represented as available in the current guided trial.</p><span className="os-status planned">Coming next</span></article>)}</div></section>
  <div className="os-callout"><strong>Your CRM is already here.</strong><p>{publicMarketing.positioning}</p><p>{publicMarketing.accountingClarification}</p></div>
  <div className="os-action-row"><Link className="os-button" href={publicMarketing.ctas.primary.href}>{publicMarketing.ctas.primary.label} →</Link><Link className="os-button os-button-outline" href="/command-inbox">Explore Command Inbox</Link></div>
</div></main></MarketingShell>}
