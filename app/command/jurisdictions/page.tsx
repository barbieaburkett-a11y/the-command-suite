import { requireModuleAccess } from '../../contractor-auth';
import { jurisdictionArtifacts, jurisdictionChecklist, jurisdictionIntegrations, jurisdictionRoles } from '../../jurisdiction-library';
import JurisdictionLibrary from './JurisdictionLibrary';
import '../command.css';
import '../workflows/workflows.css';
import '../compliance/compliance.css';
import './jurisdictions.css';

export const dynamic='force-dynamic';
export const metadata={title:'Jurisdiction Library | The Command Suite',robots:{index:false,follow:false,noarchive:true}};

export default async function JurisdictionsPage({searchParams}:{searchParams:Promise<{projectId?:string}>}){
  const context=await requireModuleAccess('jurisdiction-library');
  const {projectId=''}=await searchParams;
  const projects=await context.db.prepare("SELECT id,name,client_name,location FROM projects WHERE workspace_id=? AND status='active' ORDER BY updated_at DESC,name").bind(context.workspaceId).all<{id:string;name:string;client_name:string;location:string}>();
  const initialProjectId=(projects.results||[]).some(project=>project.id===projectId)?projectId:'';
  return <main className="command-shell workflow-shell jurisdiction-shell">
    <header className="command-top"><a href="/command" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></a><div><span>{context.workspaceName}</span><a href="/command">← Workspace</a></div></header>
    <section className="workflow-hero jurisdiction-hero"><div><small>PROTECTED · JOB-LINKED · COMPANY-SCOPED</small><h1>Every jurisdiction.<br/><em>One controlled record.</em></h1><p>Find the state, county, and city connected to a job, confirm the official source, and keep requirements, permit progress, inspections, and next actions together.</p></div><div className="workflow-hero-stat"><b>50</b><span>state directories</span></div></section>
    <aside className="compliance-boundary"><strong>What this library does</strong><span>Organizes jurisdiction references and company-private job tracking.</span><strong>What it does not do</strong><span>It does not submit permits, connect to government portals, interpret code, or guarantee approval.</span></aside>
    <JurisdictionLibrary projects={projects.results||[]} checklist={jurisdictionChecklist} roles={jurisdictionRoles} artifacts={jurisdictionArtifacts} integrationPoints={jurisdictionIntegrations} initialProjectId={initialProjectId}/>
    <footer className="command-footer"><span>Private company workspace</span><span>Job → jurisdiction → checklist → printable record</span></footer>
  </main>;
}
