import MarketingShell from '../MarketingShell';
import ResetPasswordForm from './ResetPasswordForm';

export const metadata={title:'Choose a new password | The Command Suite',description:'Securely choose a new workspace password.',robots:{index:false,follow:false}};
export default async function ResetPassword({searchParams}:{searchParams:Promise<{token?:string;error?:string}>}){const query=await searchParams;const token=query.token||'',invalid=query.error==='INVALID_TOKEN'||!token;return <MarketingShell><main className="os-subpage" id="main-content"><div className="os-wrap"><div className="os-kicker">Secure account recovery</div><h1>Choose a new password.</h1><ResetPasswordForm token={token} invalid={invalid}/></div></main></MarketingShell>}
