'use client';

import Link from 'next/link';
import type { ProductCard } from '../../product-cards';
import type { ModuleKey } from '../../pricing-tiers';
import type { BundleKey } from '../../bundles';

type Project={id:string;name:string;client_name:string;location:string};

export default function ProductCards({cards,projects,selectedProject,currentBundle,fullTrialAccess,accessibleModules}:{cards:ProductCard[];projects:Project[];selectedProject:Project|null;currentBundle:BundleKey;fullTrialAccess:boolean;accessibleModules:ModuleKey[]}){
  const moduleHref=(href:string)=>{
    if(!selectedProject)return href;
    return `${href}${href.includes('?')?'&':'?'}projectId=${encodeURIComponent(selectedProject.id)}`;
  };
  return <div className="product-catalog-layout">
    <aside className="product-catalog-nav" aria-label="Product card navigation">
      <small>WORKSPACE MODULES</small>
      {cards.map((card,index)=><a key={card.key} href={`#${card.key}`}><span>{String(index+1).padStart(2,'0')}</span>{card.moduleName}</a>)}
    </aside>
    <section className="product-catalog-main">
      <section className="product-job-context">
        <div><small>JOB-LINKED CONTEXT</small><h2>{selectedProject?selectedProject.name:'Company-wide reference'}</h2><p>{selectedProject?`${selectedProject.client_name||'Customer not connected'}${selectedProject.location?` · ${selectedProject.location}`:''}`:'Choose a job to open every applicable module with the same controlled job context.'}</p></div>
        <form method="get" action="/command/modules"><label>Job<select name="projectId" defaultValue={selectedProject?.id||''}><option value="">Company-wide reference</option>{projects.map(project=><option key={project.id} value={project.id}>{project.name}{project.client_name?` · ${project.client_name}`:''}</option>)}</select></label><button>Apply context</button></form>
      </section>
      <div className="product-card-grid">{cards.map(card=>{const entitlementKey=['project-type-selector','smart-defaults','vendor-manager'].includes(card.key)?'job-management':card.key;const accessible=fullTrialAccess||accessibleModules.includes(entitlementKey as ModuleKey);return <article className={`product-card ${accessible?'':'locked'}`} id={card.key} key={card.key}>
        <header><div><small>{accessible?(fullTrialAccess?'FULL TRIAL ACCESS':'INCLUDED IN CURRENT BUNDLE'):`UPGRADE FROM ${currentBundle.toUpperCase()}`}</small><h2>{card.moduleName}</h2><p>{card.purpose}</p></div>{accessible?<Link href={moduleHref(card.href)}>Open module →</Link>:<Link href={`/command/bundles?upgrade=${encodeURIComponent(card.key)}`}>Review Bundle upgrade →</Link>}</header>
        <div className="product-card-trigger"><small>WHEN IT IS USED · TRIGGER</small><p>{card.trigger}</p></div>
        <div className="product-card-columns"><section><h3>Key features</h3><ul>{card.features.map(item=><li key={item}>{item}</li>)}</ul></section><section><h3>Artifacts</h3><ul>{card.artifacts.map(item=><li key={item}>{item}</li>)}</ul></section></div>
        {card.includedModules&&<section className="included-modules"><h3>Included modules</h3><ol>{card.includedModules.map(item=><li key={item}>{item}</li>)}</ol></section>}
        <section><h3>Roles</h3><div className="product-role-grid">{card.roles.map(role=><div key={role.name}><b>{role.name}</b><p>{role.duties}</p></div>)}</div></section>
        <section><h3>Job-linked integration points</h3><p>{card.integrationPoints.join(' · ')}</p></section>
        <div className="product-boundaries"><section><h3>14-day trial boundary</h3><p>{card.trialBoundary}</p></section><section><h3>Company isolation</h3><p>{card.isolationBehavior}</p></section></div>
        <section className="product-limitations"><h3>Honest limitations</h3><ul>{card.limitations.map(item=><li key={item}>{item}</li>)}</ul></section>
      </article>})}</div>
      <button type="button" className="print-catalog" onClick={()=>window.print()}>Print / save Product Cards</button>
    </section>
  </div>;
}
