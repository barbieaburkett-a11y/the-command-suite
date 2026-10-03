'use client';

import Link from 'next/link';
import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ProjectTypeSelect } from '../../ProjectTypeSelect';

type ModuleDefinition = {
  name:string; purpose:string; trigger:string; behaviors:readonly string[]; artifacts:readonly string[];
  integrationPoints:readonly string[]; trialBoundary:string; isolationBehavior:string; limitations:readonly string[]; publishingNotes:readonly string[];
};
type Jurisdiction={id:string;name:string;level:string;state_name:string;county_name:string;verification_status:string};
type Lead={id:string;name:string;company:string;project_name:string;status:string;converted_project_id:string;created_at:string};
type Run={id:string;lead_id:string;project_id:string;project_name:string;status:string;detail_json:string;created_at:string};
type Notification={id:string;project_id:string;recipient_role:string;title:string;body:string;delivery_status:string;created_at:string};
type Payload={leads:Lead[];runs:Run[];notifications:Notification[];jurisdictions:Jurisdiction[];entitlements:{workflows:boolean;compliance:boolean;jurisdictions:boolean;commandInbox:boolean};trialDaysRemaining:number|null};

export default function LeadAutomation({workspaceName,trialDaysRemaining,module}:{workspaceName:string;trialDaysRemaining:number|null;module:ModuleDefinition}){
  const [data,setData]=useState<Payload|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
  const load=useCallback(async()=>{const response=await fetch('/api/command/lead-automation',{cache:'no-store'});const payload=await response.json() as Payload&{error?:string};if(!response.ok)throw new Error(payload.error||'Lead Automation could not be loaded.');setData(payload)},[]);
  useEffect(()=>{
    let active=true;
    fetch('/api/command/lead-automation',{cache:'no-store'})
      .then(async response=>{const payload=await response.json() as Payload&{error?:string};if(!response.ok)throw new Error(payload.error||'Lead Automation could not be loaded.');return payload})
      .then(payload=>{if(active)setData(payload)})
      .catch(reason=>{if(active)setError(reason instanceof Error?reason.message:'Lead Automation could not be loaded.')});
    return()=>{active=false};
  },[]);
  async function submit(event:FormEvent<HTMLFormElement>){event.preventDefault();setBusy(true);setError('');setNotice('');const form=event.currentTarget;const body={action:'intake',...Object.fromEntries(new FormData(form))};try{const response=await fetch('/api/command/lead-automation',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const payload=await response.json() as {error?:string;status?:string};if(!response.ok)throw new Error(payload.error||'The lead could not be automated.');form.reset();setNotice(payload.status==='partial'?'Lead converted. Entitlement-limited steps were recorded as skipped.':'Lead converted and the internal workflow is ready for review.');await load()}catch(reason){setError(reason instanceof Error?reason.message:'The lead could not be automated.')}finally{setBusy(false)}}
  async function markRead(id:string){await fetch('/api/command/lead-automation',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:'mark_notification_read',id})});await load()}
  return <main className="lead-automation-shell">
    <header className="lead-automation-top"><Link href="/command" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><span>PRIVATE STAGING · MODULE K</span><Link href="/command">Return to workspace</Link></div></header>
    {trialDaysRemaining!==null&&<aside className="trial-banner" role="status"><strong>{trialDaysRemaining} {trialDaysRemaining===1?'day':'days'} left in the trial</strong><span>{module.trialBoundary}</span></aside>}
    <section className="lead-automation-hero"><div><small>AUTOMATION MODULE K · INTERNAL ONLY</small><h1>One lead.<br/><em>One connected start.</em></h1><p>{module.purpose}</p></div><aside><b>{workspaceName}</b><span>{module.trigger}</span><strong>Human review remains required.</strong></aside></section>
    {error&&<p className="command-error" role="alert">{error}</p>}{notice&&<p className="command-success" role="status">{notice}</p>}
    <div className="lead-automation-body">
      <section className="automation-grid">
        <form className="automation-form" onSubmit={submit}>
          <div><small>PROTECTED LEAD INTAKE</small><h2>Start the connected job flow</h2><p>Saving this form creates the internal records shown in the automation map. It does not contact the lead, submit a permit, or approve work.</p></div>
          <label>Lead name<input name="name" required maxLength={160} autoComplete="name"/></label>
          <label>Company<input name="company" maxLength={160} autoComplete="organization"/></label>
          <label>Email<input name="email" type="email" maxLength={254} autoComplete="email"/></label>
          <label>Phone<input name="phone" type="tel" maxLength={80} autoComplete="tel"/></label>
          <label>Job name<input name="projectName" required maxLength={160} placeholder="Smith kitchen renovation"/></label>
          <label>Job location<input name="projectLocation" maxLength={300} placeholder="Street, city, state"/></label>
          <label className="wide">Verified jurisdiction<select name="jurisdictionId" defaultValue=""><option value="">Not confirmed yet</option>{data?.jurisdictions.map(item=><option key={item.id} value={item.id}>{item.name} · {item.county_name||item.state_name}</option>)}</select><span>Only manually verified starting records are offered here.</span></label>
          <label>Project type<ProjectTypeSelect/><span>This selection drives the default workflow and internal preparation lists.</span></label>
          <label>First inspection type<input name="defaultInspectionType" maxLength={160} placeholder="Example: Rough electrical"/><span>Optional until the jurisdiction confirms it. The pipeline pauses instead of guessing.</span></label>
          <label className="wide">Office notes<textarea name="notes" rows={4} maxLength={3000} placeholder="Scope, timing, referral source, or qualification notes"/></label>
          <button className="command-primary" disabled={busy}>{busy?'Building the job flow…':'Create lead-to-job flow →'}</button>
        </form>
        <div className="automation-map"><small>AUTOMATION MAP</small><h2>What Module K creates</h2><ol>{module.behaviors.map((item,index)=><li key={item}><span>{String(index+1).padStart(2,'0')}</span><p>{item}</p></li>)}</ol><div className="entitlement-strip"><b>Current automation access</b><span data-on={data?.entitlements.workflows}>Workflow</span><span data-on={data?.entitlements.compliance}>Compliance</span><span data-on={data?.entitlements.jurisdictions}>Jurisdiction</span><span data-on={data?.entitlements.commandInbox}>Command Inbox</span></div></div>
      </section>

      <section className="automation-section"><div className="automation-section-head"><div><small>RECENT RUNS</small><h2>Lead-to-job activity</h2></div><span>{data?.runs.length||0} runs</span></div>{!data?.runs.length?<div className="command-empty"><h3>No automation runs yet.</h3><p>Use the protected lead intake above to create the first connected job flow.</p></div>:<div className="automation-run-grid">{data.runs.map(run=>{const detail=JSON.parse(run.detail_json||'{}') as Record<string,string>;return <article key={run.id}><div><span className={`run-status ${run.status}`}>{run.status}</span><time>{new Date(run.created_at).toLocaleString()}</time></div><h3>{run.project_name}</h3><dl>{Object.entries(detail).map(([key,value])=><div key={key}><dt>{key.replace(/([A-Z])/g,' $1')}</dt><dd>{value.replaceAll('_',' ')}</dd></div>)}</dl><Link href="/command?view=inbox">Review next step in Command Inbox →</Link></article>})}</div>}</section>

      <section className="automation-section"><div className="automation-section-head"><div><small>INTERNAL NOTICES</small><h2>Role notification queue</h2></div><span>Email and SMS are not sent</span></div>{!data?.notifications.length?<div className="command-empty"><h3>No internal notices yet.</h3><p>Office Admin and Superintendent notices appear after the first automation run.</p></div>:<div className="notification-list">{data.notifications.map(item=><article key={item.id} data-read={item.delivery_status==='read'}><div><small>{item.recipient_role.replace('_',' ')}</small><h3>{item.title}</h3><p>{item.body}</p></div><div><time>{new Date(item.created_at).toLocaleString()}</time>{item.delivery_status==='internal_only'?<button onClick={()=>markRead(item.id)}>Mark reviewed</button>:<span>Reviewed</span>}</div></article>)}</div>}</section>

      <section className="automation-reference"><article><small>ARTIFACTS</small><h2>Records created</h2><ul>{module.artifacts.map(item=><li key={item}>{item}</li>)}</ul></article><article><small>INTEGRATION POINTS</small><h2>Connected systems</h2><ul>{module.integrationPoints.map(item=><li key={item}>{item}</li>)}</ul></article><article><small>HONEST LIMITS</small><h2>What stays human</h2><ul>{module.limitations.map(item=><li key={item}>{item}</li>)}</ul></article><article className="publishing-note"><small>PUBLISHING NOTES</small><h2>Staging boundary</h2><ul>{module.publishingNotes.map(item=><li key={item}>{item}</li>)}</ul><p>{module.isolationBehavior}</p></article></section>
    </div>
  </main>
}
