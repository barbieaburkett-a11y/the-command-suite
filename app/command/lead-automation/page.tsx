import { requireModuleAccess } from '../../contractor-auth';
import { leadAutomationModule } from '../../lead-automation';
import LeadAutomation from './LeadAutomation';
import '../command.css';
import './lead-automation.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Module K — Lead Automation | The Command Suite', robots: { index: false, follow: false, noarchive: true } };

export default async function LeadAutomationPage() {
  const context = await requireModuleAccess('job-management');
  return <LeadAutomation workspaceName={context.workspaceName} trialDaysRemaining={context.trialDaysRemaining} module={leadAutomationModule} />;
}
