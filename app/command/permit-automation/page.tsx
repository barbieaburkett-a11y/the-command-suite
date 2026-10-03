import { requireModuleAccess } from '../../contractor-auth';
import { permitAutomationModule } from '../../permit-automation';
import PermitAutomation from './PermitAutomation';
import '../command.css';
import '../lead-automation/lead-automation.css';
import './permit-automation.css';

export const dynamic='force-dynamic';
export const metadata={title:'Module L — Permit Automation | The Command Suite',robots:{index:false,follow:false,noarchive:true}};

export default async function PermitAutomationPage(){
  const context=await requireModuleAccess('compliance-pack');
  return <PermitAutomation workspaceName={context.workspaceName} trialDaysRemaining={context.trialDaysRemaining} module={permitAutomationModule}/>;
}
