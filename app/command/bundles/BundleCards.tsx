'use client';

import type { Bundle, BundleKey } from '../../bundles';
import { moduleNames } from '../../pricing-tiers';

export default function BundleCards({bundles,currentBundle,fullTrialAccess}:{bundles:Bundle[];currentBundle:BundleKey;fullTrialAccess:boolean}){
  return <>
    <div className="bundle-grid">{bundles.map(bundle=><article className={`bundle-card ${bundle.key===currentBundle?'current':''}`} key={bundle.key}>
      <header><small>{bundle.key===currentBundle?'CURRENT CONFIGURATION':'ACCESS BUNDLE'}</small><h2>{bundle.name}</h2><p>{bundle.purpose}</p></header>
      <section className="bundle-trigger"><h3>When it is used · Trigger</h3><p>{bundle.trigger}</p></section>
      <section><h3>Included modules</h3><ul className="bundle-modules">{bundle.includedModules.map(key=><li key={key}><span>✓</span>{moduleNames[key]}</li>)}</ul></section>
      <section><h3>Key features</h3><ul>{bundle.features.map(item=><li key={item}>{item}</li>)}</ul></section>
      <section><h3>Roles</h3>{bundle.roles.map(role=><div className="bundle-role" key={role.name}><b>{role.name}</b><p>{role.duties}</p></div>)}</section>
      <section><h3>Artifacts</h3><ul>{bundle.artifacts.map(item=><li key={item}>{item}</li>)}</ul></section>
      <section><h3>Job-linked integration points</h3><p>{bundle.jobIntegrationPoints.join(' · ')}</p></section>
      <section><h3>Workspace navigation link</h3><a href="/command/modules">Open protected Product Cards →</a></section>
      <div className="bundle-guardrails"><section><h3>14-day trial boundary</h3><p>{bundle.trialBehavior}</p>{fullTrialAccess&&<b>Full trial access is active for this workspace.</b>}</section><section><h3>Company isolation</h3><p>{bundle.isolationBehavior}</p></section></div>
      <section className="bundle-path"><h3>Upgrade path</h3><p>{bundle.upgradePath}</p><a href={`mailto:hello@thecommandsuite.com?subject=${encodeURIComponent(`The Command Suite ${bundle.name}`)}`}>Discuss this Bundle →</a></section>
      {bundle.plannedCapabilities&&<section className="bundle-planned"><h3>Planned—not available today</h3><ul>{bundle.plannedCapabilities.map(item=><li key={item}>{item}</li>)}</ul></section>}
      <section className="bundle-limitations"><h3>Honest limitations</h3><ul>{bundle.limitations.map(item=><li key={item}>{item}</li>)}</ul></section>
    </article>)}</div>
    <button className="print-bundles" type="button" onClick={()=>window.print()}>Print / save Bundle descriptions</button>
  </>;
}
