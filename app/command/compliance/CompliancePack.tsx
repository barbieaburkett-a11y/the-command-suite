'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { ComplianceTemplate } from '../../compliance-templates';

type Project={id:string;name:string;client_name:string;location:string};
type Instance={id:string;project_id:string;project_name:string;module_key:string;status:string;form_json:string;created_at:string;updated_at:string};
type ItemRecord={instance_id:string;item_number:number;completed:number;notes:string;completed_by:string|null;completed_at:string|null};
type ApiResponse={instances?:Instance[];items?:ItemRecord[];id?:string;reused?:boolean;error?:string};

export default function CompliancePack({templates,projects,initialProjectId=''}:{templates:ComplianceTemplate[];projects:Project[];initialProjectId?:string}){
  const [moduleKey,setModuleKey]=useState(templates[0]?.key||''),[projectId,setProjectId]=useState(projects.some(project=>project.id===initialProjectId)?initialProjectId:projects[0]?.id||'');
  const [instances,setInstances]=useState<Instance[]>([]),[items,setItems]=useState<ItemRecord[]>([]),[instanceId,setInstanceId]=useState('');
  const [busy,setBusy]=useState(true),[notice,setNotice]=useState(''),[error,setError]=useState('');
  const template=templates.find(item=>item.key===moduleKey)||templates[0];
  const matching=useMemo(()=>instances.filter(item=>item.module_key===moduleKey),[instances,moduleKey]);
  const instance=instances.find(item=>item.id===instanceId)||matching[0]||null;
  const instanceItems=instance?items.filter(item=>item.instance_id===instance.id):[];
  const formValues=useMemo(()=>{try{return instance?JSON.parse(instance.form_json||'{}') as Record<string,string>:{} }catch{return {}}},[instance]);
  const completed=instanceItems.filter(item=>Boolean(item.completed)).length;
  const load=useCallback(async(preferredId?:string)=>{setBusy(true);try{const response=await fetch('/api/command/compliance',{cache:'no-store'});const data=await response.json() as ApiResponse;if(!response.ok)throw new Error(data.error||'The Compliance Pack could not load');setInstances(data.instances||[]);setItems(data.items||[]);if(preferredId)setInstanceId(preferredId);setError('')}catch(value){setError(value instanceof Error?value.message:'The Compliance Pack could not load')}finally{setBusy(false)}},[]);
  // Initial server synchronization for this signed-in company workspace.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{void load()},[load]);

  async function send(body:Record<string,unknown>){setBusy(true);setError('');try{const response=await fetch('/api/command/compliance',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await response.json() as ApiResponse;if(!response.ok)throw new Error(data.error||'The compliance record could not be saved');await load(data.id||instanceId);return data}catch(value){setError(value instanceof Error?value.message:'The compliance record could not be saved');setBusy(false);throw value}}
  async function start(){if(!projectId){setError('Create or choose a job first.');return}const data=await send({action:'create',projectId,moduleKey});setNotice(data.reused?'The existing active record is open.':'Compliance record started for this job.');}
  async function updateItem(itemNumber:number,checked:boolean,notes:string){if(!instance)return;await send({action:'item',instanceId:instance.id,itemNumber,completed:checked,notes});setNotice(checked?'Checklist item completed.':'Checklist item reopened.');}
  async function saveForm(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!instance)return;const values=Object.fromEntries(new FormData(event.currentTarget));await send({action:'form',instanceId:instance.id,values});setNotice('Compliance form saved to the job.');}
  async function archive(){if(!instance||!window.confirm('Archive this compliance record? Its history will remain in the company database.'))return;await send({action:'archive',instanceId:instance.id});setNotice('Compliance record archived.');}
  if(!template)return null;

  return <div className="workflow-library compliance-library">
    <aside className="workflow-menu" aria-label="Compliance Pack modules"><small>COMPLIANCE PACK</small>{templates.map((item,index)=><button key={item.key} className={item.key===moduleKey?'active':''} onClick={()=>setModuleKey(item.key)}><span>{String(index+1).padStart(2,'0')}</span>{item.name}</button>)}</aside>
    <section className="workflow-workbench">
      <header className="workflow-title"><div><small>TRIGGER · {template.trigger}</small><h2>{template.name}</h2><p>{template.purpose}</p><a className="product-card-return" href={`/command/modules${projectId?`?projectId=${encodeURIComponent(projectId)}`:''}#compliance-pack`}>View Product Card →</a></div><button type="button" className="print-workflow" onClick={()=>window.print()}>Print / save PDF</button></header>
      <div className="compliance-sop-grid"><article><small>SECTIONS</small>{template.sections.map(section=><div key={section.name}><b>{section.name}</b><ul>{section.items.map(item=><li key={item}>{item}</li>)}</ul></div>)}</article><article><small>LINKED JOB WORKFLOWS</small><p>{template.linkedWorkflows.join(' · ')}</p><small>RESPONSIBLE ROLES</small><p>{template.roles.join(' · ')}</p><small>ARTIFACTS</small><p>{template.artifacts.join(' · ')}</p></article></div>
      <div className="workflow-start"><label>Job<select value={projectId} onChange={event=>setProjectId(event.target.value)}><option value="">Choose a job</option>{projects.map(project=><option key={project.id} value={project.id}>{project.name}{project.client_name?` · ${project.client_name}`:''}</option>)}</select></label><button type="button" disabled={busy||!projectId} onClick={start}>Start job record →</button></div>
      {!projects.length&&<p className="workflow-alert">Create the customer and job in your workspace first. Then return here to start its Compliance Pack.</p>}
      {error&&<p className="workflow-error" role="alert">{error}</p>}{notice&&<p className="workflow-notice" role="status">✓ {notice}</p>}
      {matching.length>0&&<label className="instance-picker">Open compliance record<select value={instance?.id||''} onChange={event=>setInstanceId(event.target.value)}>{matching.map(item=><option key={item.id} value={item.id}>{item.project_name} · {item.status}</option>)}</select></label>}
      {!instance?<div className="workflow-empty"><b>Reference now. Record when the job is ready.</b><p>The SOP above is always readable. Choose a job to activate the checklist, form, and printable record.</p></div>:<>
        <section className="workflow-progress"><div><small>{instance.project_name}</small><b>{completed} of {template.checklist.length} complete</b></div><progress max={template.checklist.length} value={completed}>{completed} of {template.checklist.length}</progress><span>{Math.round((completed/template.checklist.length)*100)}%</span></section>
        <ol className="workflow-checklist">{template.checklist.map((text,index)=>{const record=instanceItems.find(item=>item.item_number===index+1);return <li key={text} className={record?.completed?'complete':''}><label><input type="checkbox" checked={Boolean(record?.completed)} onChange={event=>void updateItem(index+1,event.target.checked,record?.notes||'')}/><span><b>{String(index+1).padStart(2,'0')}</b>{text}</span></label><textarea aria-label={`Notes for compliance item ${index+1}`} defaultValue={record?.notes||''} placeholder="Source, owner, date, confirmation, or correction" onBlur={event=>void updateItem(index+1,Boolean(record?.completed),event.currentTarget.value)}/></li>})}</ol>
        <form key={`${instance.id}-${instance.updated_at}`} className="workflow-form compliance-form" onSubmit={saveForm}><div><small>JOB-LINKED FORM</small><h3>{template.name} record</h3><p>Save the details, source, owner, and proof that belong with this job.</p></div>{template.fields.map(field=><label key={field.key}>{field.label}{field.multiline?<textarea name={field.key} rows={4} defaultValue={formValues[field.key]||''} placeholder={field.placeholder}/>:<input name={field.key} defaultValue={formValues[field.key]||''} placeholder={field.placeholder}/>}</label>)}<div className="workflow-form-actions"><button disabled={busy}>Save compliance form</button><button type="button" className="archive-workflow" onClick={archive}>Archive record</button></div></form>
      </>}
    </section>
  </div>;
}
