'use client';

import {useState} from 'react';
import type {OnboardingScreen} from '../../onboarding-flow';

type Draft={screen_key:string;screen_name:string;step_number:number;status:string;version:number;updated_at:string;content:OnboardingScreen};

export default function OnboardingPreview({drafts}:{drafts:Draft[]}){
  const [active,setActive]=useState(0);
  const select=(index:number)=>{setActive(index);requestAnimationFrame(()=>document.querySelector('.onboarding-stage')?.scrollIntoView({behavior:'smooth',block:'start'}));};
  return <>
    <nav className="onboarding-stepper" aria-label="Onboarding Flow screens">
      {drafts.map((draft,index)=><button key={draft.screen_key} type="button" aria-current={index===active?'step':undefined} onClick={()=>select(index)}><span>{String(draft.step_number).padStart(2,'0')}</span>{draft.screen_name}</button>)}
    </nav>
    <section className="onboarding-stage" aria-live="polite">
      {drafts.map((draft,index)=>{const screen=draft.content;return <article className={`onboarding-card ${index===active?'is-active':''}`} data-onboarding-screen={draft.screen_key} data-status={draft.status} key={draft.screen_key}>
        <header><div><small>STEP {String(draft.step_number).padStart(2,'0')} OF {drafts.length} · INTERNAL DRAFT · VERSION {draft.version}</small><h2>{screen.screenName}</h2><p>{screen.purpose}</p></div><span>{screen.key}</span></header>
        <section><h3>Target role</h3><ul className="audience-list">{screen.targetRoles.map(role=><li key={role}>{role}</li>)}</ul></section>
        <div className="draft-columns"><section><h3>Key actions</h3><ol>{screen.keyActions.map(item=><li key={item}>{item}</li>)}</ol></section><section><h3>Benefits</h3><ul>{screen.benefits.map(item=><li key={item}>{item}</li>)}</ul></section></div>
        <section className="draft-cta"><h3>CTA · Internal-only placeholder</h3><p>{screen.cta}</p></section>
        <section><h3>Internal integration points</h3><p>{screen.internalIntegrationPoints.join(' · ')}</p></section>
        <section><h3>Notes for future publishing · SOP</h3><ol>{screen.publishingNotes.map(item=><li key={item}>{item}</li>)}</ol></section>
        <section className="draft-limitations"><h3>Honest limitations</h3><ul>{screen.limitations.map(item=><li key={item}>{item}</li>)}</ul></section>
        <footer><span>Last staged {new Date(draft.updated_at).toLocaleDateString()}</span><span>Not approved for publishing</span></footer>
      </article>})}
      <div className="onboarding-controls"><button type="button" disabled={active===0} onClick={()=>select(active-1)}>← Previous</button><strong>{active+1} / {drafts.length}</strong><button type="button" disabled={active===drafts.length-1} onClick={()=>select(active+1)}>Next →</button></div>
    </section>
    <button className="print-drafts" type="button" onClick={()=>window.print()}>Print / save internal Onboarding Flow</button>
  </>;
}
