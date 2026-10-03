import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import PermitFinder from '../permit-command/PermitFinder';
import { publicMarketing } from '../public-marketing';

export const metadata={title:'Permit Pathfinder | The Command Suite',description:'Find official permit starting points for selected jurisdictions and keep a manual permit record with the job.',alternates:{canonical:'https://thecommandsuite.com/permit-pathfinder'}};

export default function PermitPathfinder(){return <MarketingShell><main id="main-content"><section className="os-subpage"><div className="os-wrap"><div className="os-kicker">Permit Pathfinder · limited directory</div><h1>An organized path to official jurisdiction paperwork.</h1><p className="os-lead">Start with a small, manually checked set of official city and county resources. Keep a permit number, source document, status, corrections, inspections, and next action in a manual job record.</p><div className="os-callout"><strong>Government sources remain authoritative.</strong><p>{publicMarketing.permitDisclaimer}</p></div><div className="os-action-row"><a className="os-button" href="#permit-finder">Find official resources ↓</a><Link className="os-button os-button-outline" href="/product">See the product</Link></div></div></section><PermitFinder/></main></MarketingShell>}
