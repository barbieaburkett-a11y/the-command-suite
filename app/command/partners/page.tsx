import { requireWorkspace } from '../../contractor-auth';
import PartnerDashboard from './PartnerDashboard';
export const dynamic='force-dynamic';
export const metadata={title:'Partner program | The Command Suite',robots:{index:false,follow:false}};
export default async function PartnersPage(){const ctx=await requireWorkspace();return <PartnerDashboard workspaceName={ctx.workspaceName}/>}
