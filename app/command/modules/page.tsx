import Link from 'next/link';
import { requireWorkspace } from '../../contractor-auth';
import { productCards } from '../../product-cards';
import { moduleNames, type ModuleKey } from '../../pricing-tiers';
import ProductCards from './ProductCards';
import '../command.css';
import './modules.css';
import './locks.css';

export const dynamic='force-dynamic';
export const metadata={title:'Product Cards | The Command Suite',description:'Private company-scoped feature and SOP catalog.',robots:{index:false,follow:false,noarchive:true}};
type Project={id:string;name:string;client_name:string;location:string};

export default async function ProductCardsPage({searchParams}:{searchParams:Promise<{projectId?:string}>}){
  const context=await requireWorkspace();
  const {projectId=''}=await searchParams;
  const projects=await context.db.prepare("SELECT id,name,client_name,location FROM projects WHERE workspace_id=? AND status='active' ORDER BY updated_at DESC,name").bind(context.workspaceId).all<Project>();
  const selectedProject=projectId?(projects.results||[]).find(project=>project.id===projectId)||null:null;
  const rejectedJob=Boolean(projectId&&!selectedProject);
  return <main className="command-shell product-cards-shell">
    <header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><Link href="/command">← Workspace</Link><span>{context.workspaceName}</span></div></header>
    <section className="product-cards-hero"><div><small>PROTECTED · JOB-LINKED · COMPANY-SCOPED</small><h1>Know what each module does.<br/><em>Open the right work.</em></h1><p>Product Cards are the internal map for features, roles, records, boundaries, and next steps. They remain inside this signed-in company workspace.</p></div><div><b>{productCards.length}</b><span>controlled modules</span></div></section>
    {rejectedJob&&<p className="product-context-warning" role="alert">That job is not available in this company workspace. No job information was exposed.</p>}
    <ProductCards cards={productCards} projects={projects.results||[]} selectedProject={selectedProject} currentBundle={context.bundleKey} fullTrialAccess={context.fullTrialAccess} accessibleModules={(Object.keys(moduleNames) as ModuleKey[]).filter(module=>context.canAccessModule(module))}/>
    <footer className="command-footer"><span>Private staging module</span><span>Feature → role → artifact → job record</span></footer>
  </main>;
}
