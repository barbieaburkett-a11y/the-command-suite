import { requireModuleAccess } from '../../contractor-auth';
import { inspectionAutomationModule } from '../../inspection-automation';
import InspectionAutomation from './InspectionAutomation';
import '../command.css';
import '../lead-automation/lead-automation.css';
import '../permit-automation/permit-automation.css';
import './inspection-automation.css';

export const dynamic='force-dynamic';
export const metadata={title:'Module M — Inspection Automation | The Command Suite',robots:{index:false,follow:false,noarchive:true}};

export default async function InspectionAutomationPage(){
  const context=await requireModuleAccess('compliance-pack');
  return <InspectionAutomation workspaceName={context.workspaceName} trialDaysRemaining={context.trialDaysRemaining} module={inspectionAutomationModule}/>;
}
