import { requireFrontDesk } from '../../front-desk-access';
import FrontDesk from './FrontDesk';
import '../command.css';
import './front-desk.css';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Command Front Desk | The Command Suite', robots: { index: false, follow: false, noarchive: true } };

export default async function FrontDeskPage() {
  const context = await requireFrontDesk();
  return <FrontDesk workspaceName={context.workspaceName} userName={context.user.name} trialDaysRemaining={context.trialDaysRemaining} />;
}
