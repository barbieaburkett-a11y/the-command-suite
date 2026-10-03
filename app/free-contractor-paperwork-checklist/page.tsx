'use client';

import type { FormEvent } from 'react';
import { useEffect, useMemo, useRef, useState } from 'react';
import './checklist.css';
import './checklist-enhancements.css';

const checks = [
  ['Field capture','Field updates','Crew texts and voice notes can be matched to the correct job without retyping.'],
  ['Field capture','Job photos','Every photo has a project, date, description, and responsible person.'],
  ['Revenue protection','Change orders','Scope, price, schedule impact, and customer approval live in one traceable record.'],
  ['Revenue protection','Receipts','Receipts are matched to a job and reviewed before they disappear into a truck or camera roll.'],
  ['Operations','Daily logs','Labor, weather, progress, delays, deliveries, and incidents are consistently captured.'],
  ['Operations','Permits and inspections','Applications, reviewer notes, inspection results, and next actions have an owner.'],
  ['Risk control','Compliance','COIs, W-9s, licenses, expirations, and missing documents are actively tracked.'],
  ['Risk control','Approvals','Nothing consequential moves without the correct person reviewing it.'],
  ['System handoff','System handoff','Approved information reaches accounting, project management, email, or storage without duplicate entry.'],
  ['System handoff','Audit trail','You can see the original update, what changed, who approved it, and whether it was delivered.'],
] as const;

function track(event:string){void fetch('/api/events',{method:'POST',headers:{'content-type':'application/json'},keepalive:true,body:JSON.stringify({event,path:location.pathname})});}

export default function PaperworkCheck(){
  const [saved,setSaved]=useState(false); const [loading,setLoading]=useState(false); const [error,setError]=useState(''); const [selected,setSelected]=useState<number[]>([]);
  const checklistStarted=useRef(false);
  useEffect(()=>track('lead_magnet_view'),[]);
  useEffect(()=>{const result=document.querySelector('.magnet-page .result');const finish=()=>track('checklist_completed');result?.addEventListener('click',finish);return()=>result?.removeEventListener('click',finish)},[]);
  const score=selected.length;
  const weakest=useMemo(()=>checks.find((_,index)=>!selected.includes(index))?.[0]||'Your controlled process',[selected]);
  function toggle(index:number){if(!checklistStarted.current){track('checklist_started');checklistStarted.current=true}setSelected(current=>current.includes(index)?current.filter(item=>item!==index):[...current,index]);}
  async function submit(e:FormEvent<HTMLFormElement>){e.preventDefault();setLoading(true);setError('');const data=Object.fromEntries(new FormData(e.currentTarget));data.source=new URLSearchParams(location.search).toString()||'direct';try{const response=await fetch('/api/guide-leads',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const result=await response.json() as {error?:string};if(!response.ok)throw new Error(result.error);setSaved(true);track('lead_magnet_submit');}catch(err){setError(err instanceof Error?err.message:'Please try again.');}finally{setLoading(false)}}
  return <main className="magnet-page"><a className="skip-link" href="#scorecard">Skip to checklist</a><nav><a className="brand" href="/"><img src="/logo-brand.webp" width="34" height="34" alt=""/><span>THE</span> COMMAND SUITE</a><a href="/trial">Start guided trial →</a></nav><header><div><p className="section-tag">FREE 5-MINUTE CONTRACTOR CHECK</p><h1>Where is paperwork<br/><em>leaking out of your business?</em></h1><p>Score ten field-to-office handoffs. Find the one costing you the most follow-up, duplicate entry, and office time.</p><div className="magnet-points"><span>Useful without signup</span><span>No invented savings</span><span>Built for contractor workflows</span></div></div><form onSubmit={submit}><small>OPTIONAL: SAVE YOUR INTEREST</small><h2>{saved?'You are on the list.':'Want help with your result?'}</h2>{saved?<p>We saved your details. You can still score, print, and save the checklist below.</p>:<><label>Name<input required name="name" autoComplete="name"/></label><label>Work email<input required type="email" name="email" autoComplete="email"/></label><label>Company<input required name="company" autoComplete="organization"/></label><input className="honeypot" name="website" tabIndex={-1} aria-hidden="true"/><label className="consent"><input required type="checkbox"/> Contact me about this checklist and practical workflow updates. I can unsubscribe anytime.</label>{error&&<p className="magnet-error" role="alert">{error}</p>}<button className="primary" disabled={loading}>{loading?'Saving…':'Save my details →'}</button><small>Optional. The checklist works without submitting. See our <a href="/privacy">Privacy Policy</a>.</small></>}</form></header><section id="scorecard"><div className="score-intro"><p className="section-tag">THE PAPERWORK LEAK CHECK</p><h2>Can you answer “yes”<br/>without hunting?</h2><p>Check an item only when the process is consistent—not when one person remembers how to do it.</p><div className="score-meter" aria-live="polite"><strong>{score}/10 controlled</strong><span>{score<4?'Start with one weekly leak.':score<8?'Your foundation is forming.':'Your handoffs are unusually disciplined.'}</span></div></div><div className="check-list">{checks.map(([category,title,description],index)=><label key={title}><input type="checkbox" checked={selected.includes(index)} onChange={()=>toggle(index)}/><span><small>{category}</small><b>{String(index+1).padStart(2,'0')} · {title}</b>{description}</span></label>)}</div><div className="result"><h3>Your next move</h3><p><b>Weakest unchecked category: {weakest}.</b> Choose the first unchecked item that happens every week. That is the strongest candidate for a scoped workflow review.</p><button type="button" className="secondary" onClick={()=>window.print()}>Print or save this check</button><a className="primary" href={`mailto:hello@thecommandsuite.com?subject=My%20Paperwork%20Leak%20Check&body=My%20score%20is%20${score}%2F10.%0AThe%20handoff%20I%20want%20to%20fix%20first%20is%3A%20`}>Email my result →</a></div></section><footer><a href="/">The Command Suite</a><span>Capture once. Structure it. Approve it. Route it.</span></footer></main>
}
