import { requireModuleAccess } from '../../contractor-auth';
import { fullPipelineAutomationModule } from '../../full-pipeline-automation';
import FullPipelineAutomation from './FullPipelineAutomation';
import '../command.css';
import '../lead-automation/lead-automation.css';
import './full-pipeline-automation.css';

export const dynamic='force-dynamic';
export const metadata={title:'Module O — Full Pipeline Automation | The Command Suite',robots:{index:false,follow:false,noarchive:true}};
export default async function FullPipelineAutomationPage(){const context=await requireModuleAccess('compliance-pack');return <FullPipelineAutomation workspaceName={context.workspaceName} trialDaysRemaining={context.trialDaysRemaining} module={fullPipelineAutomationModule}/>}
