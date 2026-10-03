import Link from 'next/link';
import MarketingShell from '../MarketingShell';
import ForgotPasswordForm from './ForgotPasswordForm';

export const metadata={title:'Reset your password | The Command Suite',description:'Request a secure password-reset link.',robots:{index:false,follow:false}};
export default function ForgotPassword(){return <MarketingShell><main className="os-subpage" id="main-content"><div className="os-wrap"><div className="os-kicker">Account recovery</div><h1>Reset your password.</h1><p className="os-lead">Enter the work email connected to your company workspace.</p><ForgotPasswordForm/><p><Link href="/login">Return to sign in</Link></p></div></main></MarketingShell>}
