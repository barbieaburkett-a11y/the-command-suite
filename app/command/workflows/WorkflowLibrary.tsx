'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkflowTemplate } from '../../workflow-templates';
import { projectTypeMap, projectTypeLabel } from '../../project-types';

type Project={id:string;name:string;client_name:string;location:string;project_type_key:string};
type Instance={id:string;project_id:string;project_name:string;template_key:string;status:string;form_json:string;created_at:string;updated_at:string};
type StepRecord={instance_id:string;step_number:number;completed:number;notes:string;completed_by:string|null;completed_at:string|null};
type ApiResponse={instances?:Instance[];steps?:StepRecord[];id?:string;error?:string};

export default function WorkflowLibrary({templates,projects,initialProjectId=''}:{templates:WorkflowTemplate[];projects:Project[];initialProjectId?:string}){
  const initialJob=projects.find(project=>project.id===(projects.some(item=>item.id===initialProjectId)?initialProjectId:projects[0]?.id));
  const [templateKey,setTemplateKey]=useState(projectTypeMap[initialJob?.project_type_key||'']?.defaultWorkflow||templates[0]?.key||'');
  const [projectId,setProjectId]=useState(initialJob?.id||'');
  const [instances,setInstances]=useState<Instance[]>([]),[steps,setSteps]=useState<StepRecord[]>([]);
  const [instanceId,setInstanceId]=useState(''),[busy,setBusy]=useState(true),[notice,setNotice]=useState(''),[error,setError]=useState('');
  const template=templates.find(item=>item.key===templateKey)||templates[0];
  const matching=useMemo(()=>instances.filter(item=>item.template_key===templateKey),[instances,templateKey]);
  const instance=instances.find(item=>item.id===instanceId)||matching[0]||null;
  const instanceSteps=instance?steps.filter(item=>item.instance_id===instance.id):[];
  const formValues=useMemo(()=>{try{return instance?JSON.parse(instance.form_json||'{}') as Record<string,string>:{} }catch{return {}}},[instance]);
  const completed=instanceSteps.filter(step=>Boolean(step.completed)).length;

  const load=useCallback(async(preferredId?:string)=>{setBusy(true);try{const response=await fetch('/api/command/workflows',{cache:'no-store'});const data=await response.json() as ApiResponse;if(!response.ok)throw new Error(data.error||'Workflows could not load');setInstances(data.instances||[]);setSteps(data.steps||[]);if(preferredId)setInstanceId(preferredId);setError('')}catch(value){setError(value instanceof Error?value.message:'Workflows could not load')}finally{setBusy(false)}},[]);
  // Initial server synchronization for the signed-in workspace.
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(()=>{void load()},[load]);

  async function send(body:Record<string,unknown>){setBusy(true);setError('');try{const response=await fetch('/api/command/workflows',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});const data=await response.json() as ApiResponse;if(!response.ok)throw new Error(data.error||'The workflow could not be saved');await load(data.id||instanceId);return data}catch(value){setError(value instanceof Error?value.message:'The workflow could not be saved');setBusy(false);throw value}}
  async function start(){if(!projectId){setError('Create or choose a job first.');return}const data=await send({action:'create',projectId,templateKey});setNotice(data.id?'Workflow started for this job.':'Workflow is ready.');}
  async function updateStep(stepNumber:number,checked:boolean,notes:string){if(!instance)return;await send({action:'step',instanceId:instance.id,stepNumber,completed:checked,notes});setNotice(checked?'Step completed and saved.':'Step reopened.');}
  async function saveForm(event:FormEvent<HTMLFormElement>){event.preventDefault();if(!instance)return;const values=Object.fromEntries(new FormData(event.currentTarget));await send({action:'form',instanceId:instance.id,values});setNotice('Job form saved.');}
  async function archive(){if(!instance||!window.confirm('Archive this job workflow? Its history will remain in the workspace database.'))return;await send({action:'archive',instanceId:instance.id});setNotice('Workflow archived.');}

  if(!template)return null;
  return <div className="workflow-library">
    <aside className="workflow-menu" aria-label="Workflow templates"><small>CHOOSE A PLAYBOOK</small>{templates.map((item,index)=><button key={item.key} className={item.key===templateKey?'active':''} onClick={()=>setTemplateKey(item.key)}><span>{String(index+1).padStart(2,'0')}</span>{item.name}</button>)}</aside>
    <section className="workflow-workbench">
      <header className="workflow-title"><div><small>{template.trigger}</small><h2>{template.name}</h2><p>{template.purpose}</p><a className="product-card-return" href={`/command/modules${projectId?`?projectId=${encodeURIComponent(projectId)}`:''}#workflow-playbooks`}>View Product Card →</a>{projectId&&<a className="product-card-return" href={`/command/vendors?projectId=${encodeURIComponent(projectId)}`}>Assign an optional vendor →</a>}</div><button type="button" className="print-workflow" onClick={()=>window.print()}>Print / save PDF</button></header>
      <div className="workflow-start"><label>Job<select value={projectId} onChange={event=>{const id=event.target.value;setProjectId(id);const profile=projectTypeMap[projects.find(project=>project.id===id)?.project_type_key||''];if(profile)setTemplateKey(profile.defaultWorkflow)}}><option value="">Choose a job</option>{projects.map(project=><option key={project.id} value={project.id}>{project.name} · {projectTypeLabel(project.project_type_key)}{project.client_name?` · ${project.client_name}`:''}</option>)}</select></label><button type="button" disabled={busy||!projectId} onClick={start}>Start this workflow →</button></div>
      {!projects.length&&<p className="workflow-alert">Create the customer and job in your workspace first. Then return here to start a workflow.</p>}
      {error&&<p className="workflow-error" role="alert">{error}</p>}{notice&&<p className="workflow-notice" role="status">✓ {notice}</p>}
      <div className="workflow-meta"><article><small>ROLES</small><p>{template.roles.join(' · ')}</p></article><article><small>RECORDS CREATED</small><p>{template.artifacts.join(' · ')}</p></article></div>
      {matching.length>0&&<label className="instance-picker">Open job workflow<select value={instance?.id||''} onChange={event=>setInstanceId(event.target.value)}>{matching.map(item=><option key={item.id} value={item.id}>{item.project_name} · {item.status}</option>)}</select></label>}
      {!instance?<div className="workflow-empty"><b>Ready when the job is.</b><p>Select a job and start this workflow. Nothing is created until you choose a job.</p></div>:<>
        <section className="workflow-progress"><div><small>{instance.project_name}</small><b>{completed} of {template.steps.length} complete</b></div><progress max={template.steps.length} value={completed}>{completed} of {template.steps.length}</progress><span>{Math.round((completed/template.steps.length)*100)}%</span></section>
        <ol className="workflow-checklist">{template.steps.map((text,index)=>{const record=instanceSteps.find(item=>item.step_number===index+1);return <li key={text} className={record?.completed?'complete':''}><label><input type="checkbox" checked={Boolean(record?.completed)} onChange={event=>void updateStep(index+1,event.target.checked,record?.notes||'')}/><span><b>{String(index+1).padStart(2,'0')}</b>{text}</span></label><textarea aria-label={`Notes for step ${index+1}`} defaultValue={record?.notes||''} placeholder="Owner, date, confirmation, or note" onBlur={event=>void updateStep(index+1,Boolean(record?.completed),event.currentTarget.value)}/></li>})}</ol>
        <form key={`${instance.id}-${instance.updated_at}`} className="workflow-form" onSubmit={saveForm}><div><small>JOB FORM</small><h3>{template.name} record</h3><p>Save the details that prove this workflow was handled.</p></div>{template.fields.map(field=><label key={field.key}>{field.label}{field.multiline?<textarea name={field.key} rows={4} defaultValue={formValues[field.key]||''} placeholder={field.placeholder}/>:<input name={field.key} defaultValue={formValues[field.key]||''} placeholder={field.placeholder}/>}</label>)}<div className="workflow-form-actions"><button disabled={busy}>Save job form</button><button type="button" className="archive-workflow" onClick={archive}>Archive workflow</button></div></form>
      </>}
    </section>
  </div>;
}
