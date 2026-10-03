import MarketingShell from '../MarketingShell';
import AccountForm from '../workspace-account-form';

export const metadata={title:'Workspace login | The Command Suite',description:'Sign in to your contractor-company workspace.',robots:{index:false,follow:false}};
export default function Login(){return <MarketingShell><main className="os-subpage" id="main-content"><div className="os-wrap"><div className="os-kicker">Welcome back</div><h1>Open your company workspace.</h1><AccountForm mode="login"/></div></main></MarketingShell>}
