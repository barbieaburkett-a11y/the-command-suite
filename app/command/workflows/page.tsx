import Link from 'next/link';
import { requireModuleAccess } from '../../contractor-auth';
import { workflowTemplates } from '../../workflow-templates';
import WorkflowLibrary from './WorkflowLibrary';
import '../command.css';
import './workflows.css';

export const dynamic = 'force-dynamic';
export const metadata = { title:'Job workflows | The Command Suite', description:'Private job workflow checklists and records.', robots:{index:false,follow:false,noarchive:true} };

type Project={id:string;name:string;client_name:string;location:string;project_type_key:string};

export default async function WorkflowPage({searchParams}:{searchParams:Promise<{projectId?:string}>}){
  const context=await requireModuleAccess('workflow-playbooks');
  const {projectId=''}=await searchParams;
  const result=await context.db.prepare("SELECT id,name,client_name,location,project_type_key FROM projects WHERE workspace_id=? AND status='active' ORDER BY updated_at DESC").bind(context.workspaceId).all<Project>();
  const initialProjectId=(result.results||[]).some(project=>project.id===projectId)?projectId:'';
  return <main className="command-shell workflow-shell">
    <header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><Link href="/command">← Workspace</Link><span>{context.workspaceName}</span></div></header>
    <section className="workflow-hero"><div><small>JOB-BASED PLAYBOOKS</small><h1>Run the work.<br/><em>Keep the proof.</em></h1><p>Choose a job and start the checklist that matches the work. Each saved checklist and form stays inside your company workspace.</p></div><div className="workflow-hero-stat"><b>10</b><span>contractor workflows</span></div></section>
    <WorkflowLibrary templates={workflowTemplates} projects={result.results} initialProjectId={initialProjectId}/>
    <footer className="command-footer"><span>Private company workspace</span><span>Job → checklist → form → record</span></footer>
  </main>;
}
