import Link from 'next/link';
import { requireModuleAccess } from '../../contractor-auth';
import { projectTypeGroups } from '../../project-types';
import { projectTypeSelectorModule } from '../../project-type-selector';
import ProjectTypeModule from './ProjectTypeModule';
import '../command.css';
import '../lead-automation/lead-automation.css';
import './project-types.css';
export const dynamic='force-dynamic';
export const metadata={title:'Module P — Project Type Selector | The Command Suite',robots:{index:false,follow:false,noarchive:true}};
export default async function ProjectTypePage(){const context=await requireModuleAccess('job-management');const jobs=await context.db.prepare("SELECT id,name,project_type_key,project_type_category,pipeline_stage FROM projects WHERE workspace_id=? AND status='active' ORDER BY updated_at DESC").bind(context.workspaceId).all<{id:string;name:string;project_type_key:string;project_type_category:string;pipeline_stage:string}>();return <main className="command-shell project-type-shell"><header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt=""/><span>THE COMMAND SUITE</span></Link><div><span>PRIVATE STAGING · MODULE P</span><Link href="/command">Return to workspace</Link></div></header>{context.trialDaysRemaining!==null&&<aside className="trial-banner" role="status"><strong>{context.trialDaysRemaining} days left in the trial</strong><span>The selector inherits the existing trial boundary and never changes pricing or Bundles.</span></aside>}<ProjectTypeModule workspaceName={context.workspaceName} groups={projectTypeGroups} jobs={jobs.results} module={projectTypeSelectorModule}/></main>}
