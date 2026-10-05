import type { Metadata } from 'next';
import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import { frontDeskFaq, frontDeskPlans, frontDeskStatus } from '../front-desk-marketing';
import { checkoutLinks } from '../checkout-links';

export const metadata: Metadata = {
  title: 'Command Front Desk | Answer Every Contractor Lead Fast',
  description: 'Command Front Desk drafts a reply to every new lead in your own voice within seconds. You approve it from your phone. 14-day free trial, no credit card.',
  alternates: { canonical: 'https://thecommandsuite.com/front-desk' },
  openGraph: {
    title: 'Command Front Desk | The Command Suite',
    description: 'Every lead gets a reply in your voice before you are off the job. Nothing is sent without your OK.',
    url: 'https://thecommandsuite.com/front-desk',
    images: [{ url: '/og-command-suite-warm.png', width: 1728, height: 905, alt: 'Command Front Desk drafts replies to contractor leads for owner approval.' }],
  },
  twitter: { card: 'summary_large_image', images: ['/og-command-suite-warm.png'] },
};

const steps = [
  ['01', 'A lead comes in', 'A homeowner fills in the lead form on your website. Emails and Instagram DMs can be pasted in with one button.'],
  ['02', 'A reply is drafted', 'Within seconds, Front Desk writes a reply using your Playbook: your services, area, pricing guidance and the way you talk.'],
  ['03', 'You approve it', 'You get an email alert. Read the reply, change a word if you want, and tap Approve and send from your phone.'],
  ['04', 'Nothing slips', 'Every lead sits on one list with its status, the next step and when to follow up.'],
] as const;

export default function FrontDeskPage(){return <MarketingShell><main id="main-content" className="marketing-home">
  <section className="mh-hero"><div className="os-wrap mh-hero-grid"><div>
    <div className="os-kicker">COMMAND FRONT DESK · FOR BUSY CONTRACTORS</div>
    <h1>Every lead gets a reply <em>before you’re off the roof.</em></h1>
    <p className="mh-lead">Command Front Desk drafts a reply to each new lead in your own voice within seconds. You approve it from your phone, and every lead lands on one list with a follow-up reminder.</p>
    <div className="os-action-row"><Link className="os-button" href="/trial">Start My 14-Day Free Trial</Link><Link className="os-button os-button-outline" href="#front-desk-pricing">See Front Desk pricing</Link></div>
    <p className="mh-trust">No credit card. Nothing is sent without your OK.</p>
  </div>
  <div className="mh-record" aria-label="Illustrative Front Desk lead and suggested reply">
    <div className="mh-record-top"><span>WEBSITE FORM · 8:47 PM · ILLUSTRATIVE</span><b>Reply ready</b></div>
    <blockquote>“Hi! Looking for a quote on a kitchen remodel, budget around $18k. Can someone come out this week?”</blockquote>
    <div className="fd-draft"><span>Suggested reply · in your voice</span><p>Hi Sarah, thanks for reaching out. We’d love to help with your kitchen. Does Thursday at 10am work for a free estimate?</p><div className="fd-draft-actions"><b>Approve and send</b><small>Edit</small></div></div>
    <div className="mh-record-grid"><div><span>Lead</span><b>Kitchen remodel</b></div><div><span>Drafted in</span><b>Seconds</b></div><div><span>Next step</span><b>Book estimate</b></div></div>
  </div></div></section>

  <section className="mh-problem"><div className="os-wrap mh-split"><div><div className="os-kicker">THE LEAD PROBLEM</div><h2>The first contractor to answer usually gets the job.</h2></div><div>
    <p>Leads come in while you’re on a ladder, driving between jobs or finally sitting down for dinner. By the time you write back, the homeowner may have already booked someone else.</p>
    <ul><li>Website forms wait until you get back to the truck.</li><li>Late-night messages sit until morning.</li><li>Follow-ups live in your head instead of on a list.</li><li>Hiring office staff to answer leads costs far more than $149 a month.</li></ul>
  </div></div></section>

  <section className="mh-flow"><div className="os-wrap"><div className="os-section-head"><div><div className="os-kicker">HOW IT WORKS</div><h2>Lead in. Reply ready. You approve.</h2></div><p>You stay in control of every word. Front Desk does the typing and the remembering.</p></div>
    <div className="mh-flow-grid fd-flow-grid">{steps.map(([number,title,copy])=><article key={title}><span>{number}</span><h3>{title}</h3><p>{copy}</p></article>)}</div>
  </div></section>

  <section className="mh-available" id="what-works-today"><div className="os-wrap"><div className="os-section-head"><div><div className="os-kicker">WHAT WORKS TODAY</div><h2>Clear labels. No roadmap dressed up as a product.</h2></div><p>Here is exactly what Command Front Desk does today, and what is coming next.</p></div>
    <div className="mh-available-grid">{frontDeskStatus.map(([status,name,detail])=><article key={name}><span>{status}</span><h3>{name}</h3><p>{detail}</p></article>)}</div>
  </div></section>

  <section className="mh-pricing" id="front-desk-pricing"><div className="os-wrap">
    <div className="os-section-head"><div><div className="os-kicker">FRONT DESK PRICING</div><h2>Pick how much help you want.</h2></div><p>Start with the 14-day free trial, no credit card. Ready now? Subscribe on Stripe’s secure checkout; cancel future months anytime.</p></div>
    <div className="fd-price-grid">{frontDeskPlans.map(plan=><article className="mh-price-card" key={plan.name}>
      <span>{plan.name.toUpperCase()}</span><strong>{plan.price}<small>/month</small></strong><p>{plan.setup}</p><b>{plan.summary}</b>
      <ul>{plan.includes.map(item=><li key={item}>{item}</li>)}</ul>
      <Link className={plan.featured?'os-button':'os-button os-button-outline'} href="/trial">Start free trial</Link>
      <a className="fd-buy" href={plan.checkout}>Skip the trial and subscribe →</a>
    </article>)}</div>
    <p className="fd-bundle"><strong>Bundle and save.</strong> Get The Command Suite contractor CRM and Command Front Desk together for <strong>$249/month</strong> instead of $298, with the same $299 one-time setup. That’s $49 saved every month, $588 a year. <a href={checkoutLinks.bundle}>Get the bundle →</a> or <Link href="/contact">ask a question</Link>.</p>
  </div></section>

  <section className="mh-faq"><div className="os-wrap"><div className="os-kicker">FREQUENT QUESTIONS</div><h2>Clear answers before you start.</h2><div className="mh-faq-list">{frontDeskFaq.map(item=><details key={item.question}><summary>{item.question}<span aria-hidden="true">+</span></summary><p>{item.answer}</p></details>)}</div></div></section>

  <section className="mh-final"><div className="os-wrap"><div className="os-kicker">TRY IT ON YOUR NEXT LEAD</div><h2>Stop losing jobs to whoever answers first.</h2><p>Start a 14-day free trial, add your Playbook and put the lead form on your site. No credit card needed.</p><div className="os-action-row"><Link className="os-button" href="/trial">Start My 14-Day Free Trial</Link><Link className="os-button os-button-outline" href="/contact">Ask a question</Link></div></div></section>
</main></MarketingShell>}
