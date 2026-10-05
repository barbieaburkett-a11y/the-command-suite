import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import { publicMarketing } from '../public-marketing';
import { checkoutLinks } from '../checkout-links';

export const metadata={title:'14-Day Free Trial, Then $149 a Month | The Command Suite',description:'Start a 14-day guided trial. Then continue for one flat price of $149 per month.',alternates:{canonical:'https://thecommandsuite.com/pricing'}};

export default function PricingPage(){return <MarketingShell><main className="os-subpage" id="main-content"><div className="os-wrap">
  <div className="os-kicker">Simple pricing</div><h1>Try one real contractor workflow before you pay.</h1><p className="os-lead">Every new Company Workspace starts with a guided 14-day trial. No credit card is collected and no automatic charge is created during signup.</p>
  <div className="os-subgrid" style={{gridTemplateColumns:'repeat(2,minmax(0,1fr))'}}>
    <article className="os-subcard"><div className="os-kicker">Days 1–14</div><h2>Guided trial</h2><p>{publicMarketing.offer.guidedSetup} Use the working customer, job, Command Inbox, crew-link, approval, file, scheduled-date, and export tools in one private Company Workspace.</p><p style={{marginTop:12}}>Your records are preserved if the trial ends, but workspace activity may pause until access is continued.</p><Link className="os-button" href={publicMarketing.ctas.primary.href}>{publicMarketing.ctas.primary.label} →</Link></article>
    <article className="os-subcard"><div className="os-kicker">After your trial</div><h2>$149/month, one flat price</h2><p>{publicMarketing.offer.introductoryPrice} {publicMarketing.offer.ongoingPrice} {publicMarketing.offer.confirmation}</p><p style={{marginTop:12}}>The working contractor CRM is included. Advanced estimating, dispatch, invoicing, and payments remain clearly labeled planned. {publicMarketing.accountingClarification}</p><a className="os-button os-button-outline" href={checkoutLinks.commandSuite}>Subscribe for $149/month →</a></article>
  </div>
  <div className="os-callout"><strong>Looking for Command Front Desk?</strong><p>Front Desk answers your leads and has its own plans, from $149/month. <Link href="/front-desk#front-desk-pricing">See Front Desk pricing →</Link></p></div>
  <div className="os-callout"><strong>No surprise charge</strong><p>The trial signup does not collect a payment method. When you subscribe, Stripe’s secure checkout shows the price and billing schedule before you pay. Cancel future renewal before the next billing date by emailing <a href="mailto:hello@thecommandsuite.com">hello@thecommandsuite.com</a>.</p></div>
  <div className="os-callout"><strong>Why we call customers partners</strong><p>{publicMarketing.partnerExplanation}</p></div>
</div></main></MarketingShell>}
