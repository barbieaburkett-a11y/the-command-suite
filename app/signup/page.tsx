import MarketingShell from '../MarketingShell';
import { publicMarketing } from '../public-marketing';
import AccountForm from '../workspace-account-form';

export const metadata={title:'Start a 14-day trial | The Command Suite',description:'Create a private contractor-company workspace and start a 14-day free trial.',robots:{index:false,follow:false}};
export default function Signup(){return <MarketingShell><main className="os-subpage" id="main-content"><div className="os-wrap"><div className="os-kicker">14-day guided trial</div><h1>Create your Company Workspace.</h1><p className="os-lead">Keep customers, jobs, field updates, files, scheduled dates, and approvals connected. No credit card is collected or charged when you create the account.</p><AccountForm mode="signup"/><p className="os-small-note">Founding Partners may continue for {publicMarketing.offer.introductoryPrice.toLowerCase()} {publicMarketing.offer.ongoingPrice} We confirm all terms before payment.</p></div></main></MarketingShell>}
