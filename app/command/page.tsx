import { requireWorkspace } from '../contractor-auth';
import CommandApp from './CommandApp';
import './command.css';

export const dynamic = 'force-dynamic';
export const metadata = { title:'Contractor workspace | The Command Suite', description:'Private contractor workspace.', robots:{index:false,follow:false,noarchive:true} };

const views=['dashboard','inbox','capture','jobs','customers','schedule','files','settings'] as const;

export default async function CommandPage({searchParams}:{searchParams:Promise<{view?:string}>}) {
  const context = await requireWorkspace();
  const {view}=await searchParams;
  const initialView=views.includes(view as typeof views[number])?view as typeof views[number]:'dashboard';
  return <CommandApp user={{ displayName: context.user.name, email: context.user.email }} workspaceName={context.workspaceName} trialDaysRemaining={context.trialDaysRemaining} initialView={initialView} planTier={context.planTier} bundleKey={context.bundleKey} internalMarketingAccess={context.internalMarketingAccess} moduleAccess={{workflows:context.canAccessModule('workflow-playbooks'),compliance:context.canAccessModule('compliance-pack'),jurisdictions:context.canAccessModule('jurisdiction-library')}} />;
}
