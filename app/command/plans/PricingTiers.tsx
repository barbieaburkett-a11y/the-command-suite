'use client';

import type { PricingTier, TierKey } from '../../pricing-tiers';
import { moduleNames } from '../../pricing-tiers';

export default function PricingTiers({tiers,currentTier,fullTrialAccess}:{tiers:PricingTier[];currentTier:TierKey;fullTrialAccess:boolean}){
  return <>
    <div className="tier-grid">{tiers.map(tier=><article className={`tier-card ${tier.key===currentTier?'current':''}`} key={tier.key}>
      <header><small>{tier.key===currentTier?'CURRENT CONFIGURATION':'PRICING TIER'}</small><h2>{tier.name}</h2><p className="tier-price">{tier.price}</p></header>
      <section className="tier-trial"><h3>14-day trial behavior</h3><p>{tier.trialBehavior}</p>{fullTrialAccess&&<b>Full trial access is active for this workspace.</b>}</section>
      <section><h3>Access level</h3><ul className="tier-modules">{Object.entries(moduleNames).map(([key,name])=><li className={tier.modules.includes(key as keyof typeof moduleNames)?'included':'excluded'} key={key}><span>{tier.modules.includes(key as keyof typeof moduleNames)?'✓':'—'}</span>{name}</li>)}</ul></section>
      <section><h3>Limits</h3><dl><div><dt>Usage</dt><dd>{tier.limits.usage}</dd></div><div><dt>Jobs</dt><dd>{tier.limits.jobs}</dd></div><div><dt>Crew</dt><dd>{tier.limits.crew}</dd></div><div><dt>Storage</dt><dd>{tier.limits.storage}</dd></div><div><dt>Workflows</dt><dd>{tier.limits.workflows}</dd></div></dl></section>
      <section><h3>Roles</h3>{tier.roles.map(role=><div className="tier-role" key={role.name}><b>{role.name}</b><p>{role.duties}</p></div>)}</section>
      <section><h3>Artifacts</h3><ul>{tier.artifacts.map(item=><li key={item}>{item}</li>)}</ul></section>
      <section><h3>Workspace integration points</h3><p>{tier.integrationPoints.join(' · ')}</p></section>
      <section className="tier-upgrade"><h3>Upgrade path</h3><p>{tier.upgradePath}</p><a href={`mailto:hello@thecommandsuite.com?subject=${encodeURIComponent(`The Command Suite ${tier.name}`)}`}>Discuss this tier →</a></section>
      <section className="tier-limitations"><h3>Honest limitations</h3><ul>{tier.limitations.map(item=><li key={item}>{item}</li>)}</ul></section>
    </article>)}</div>
    <button className="print-tiers" type="button" onClick={()=>window.print()}>Print / save tier descriptions</button>
  </>;
}
