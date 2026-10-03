import { requireModuleAccess } from '../../contractor-auth';
import { closeoutAutomationModule } from '../../closeout-automation';
import CloseoutAutomation from './CloseoutAutomation';
import '../command.css';
import '../lead-automation/lead-automation.css';
import '../permit-automation/permit-automation.css';
import '../inspection-automation/inspection-automation.css';
import './closeout-automation.css';

export const dynamic='force-dynamic';
export const metadata={title:'Module N — Closeout Automation | The Command Suite',robots:{index:false,follow:false,noarchive:true}};
export default async function CloseoutAutomationPage(){const context=await requireModuleAccess('compliance-pack');return <CloseoutAutomation workspaceName={context.workspaceName} trialDaysRemaining={context.trialDaysRemaining} module={closeoutAutomationModule}/>}
