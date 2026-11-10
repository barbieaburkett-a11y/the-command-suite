import Link from 'next/link';
import { requireModuleAccess } from '../../contractor-auth';
import { estimateBuilderModule } from '../../estimate-builder';
import EstimateBuilder from './EstimateBuilder';
import '../command.css';
import './estimates.css';
export const dynamic = 'force-dynamic';
export const metadata = { title: 'Estimate Builder | The Command Suite', robots: { index: false, follow: false, noarchive: true } };
export default async function EstimatesPage({ searchParams }: { searchParams: Promise<{ projectId?: string }> }) {
  const context = await requireModuleAccess('job-management'), { projectId = '' } = await searchParams;
  return <main className="command-shell estimates-shell"><header className="command-top"><Link href="/" className="command-brand"><img src="/logo-brand.png" alt="" /><span>THE COMMAND SUITE</span></Link><div><span>PRIVATE STAGING · ESTIMATE BUILDER</span><Link href="/command">Return to workspace</Link></div></header>{context.trialDaysRemaining !== null && <aside className="trial-banner" role="status"><strong>{context.trialDaysRemaining} days left in the trial</strong><span>Estimates stay private to this workspace and price work from your own library.</span></aside>}<EstimateBuilder workspaceName={context.workspaceName} initialProjectId={projectId} module={estimateBuilderModule} /></main>;
}
