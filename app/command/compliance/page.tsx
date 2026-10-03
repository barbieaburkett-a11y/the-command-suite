import Link from 'next/link';
import { requireModuleAccess } from '../../contractor-auth';
import { complianceTemplates } from '../../compliance-templates';
import CompliancePack from './CompliancePack';
import '../command.css';
import '../workflows/workflows.css';
import './compliance.css';

export const dynamic='force-dynamic';
export const metadata={title:'Compliance Pack | The Command Suite',description:'Private job-linked permit and inspection compliance records.',robots:{index:false,follow:false,noarchive:true}};
type Project={id:string;name:string;client_name:string;location:string};

export default async function CompliancePage({searchParams}:{searchParams:Promise<{projectId?:string}>}){
  const context=await requireModuleAccess('compliance-pack');
  const {projectId=''}=await searchParams;
  const result=await context.db.prepare("SELECT id,name,client_name,location FROM projects WHERE workspace_id=? AND status='active' ORDER BY updated_at DESC").bind(context.workspaceId).all<Project>();
  const initialProjectId=(result.results||[]).some(project=>project.id===projectId)?projectId:'';
  return <main className="command-shell workflow-shell compliance-shell">
    <header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><Link href="/command">← Workspace</Link><span>{context.workspaceName}</span></div></header>
    <section className="workflow-hero compliance-hero"><div><small>PROTECTED · JOB-LINKED · COMPANY-SCOPED</small><h1>Correct paperwork.<br/><em>The first time.</em></h1><p>Prepare, review, and document permit and inspection work beside the job it belongs to. Official jurisdiction sources remain authoritative.</p></div><div className="workflow-hero-stat"><b>10</b><span>compliance modules</span></div></section>
    <aside className="compliance-boundary"><strong>What this pack does</strong><span>Organizes requirements, checklists, packets, photos, decisions, and proof inside the job record.</span><strong>What it does not do</strong><span>It does not submit applications, monitor government portals, or guarantee approval.</span></aside>
    <CompliancePack templates={complianceTemplates} projects={result.results} initialProjectId={initialProjectId}/>
    <footer className="command-footer"><span>Private company workspace</span><span>Job → compliance check → packet → printable record</span></footer>
  </main>;
}
