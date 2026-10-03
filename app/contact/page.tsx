import MarketingShell from '../MarketingShell';
import AccessLeadForm from '../customer-login/AccessLeadForm';

export const metadata={title:'Contact The Command Suite',description:'Ask about the Founding Partner guided trial or request a practical review of one contractor office handoff.',alternates:{canonical:'https://thecommandsuite.com/contact'}};

export default function ContactPage(){return <MarketingShell><main className="os-subpage" id="main-content"><div className="os-wrap"><div className="os-kicker">Contact</div><h1>Show us the handoff that keeps breaking.</h1><p className="os-lead">Send a short description of what arrives from the field, what the office repeats, and the useful result you need. Please do not include private customer details, plans, or financial documents in this general inquiry.</p><div style={{maxWidth:760,marginTop:28}}><AccessLeadForm/></div><p className="os-small-note">Prefer email? <a href="mailto:hello@thecommandsuite.com">hello@thecommandsuite.com</a>. We normally reply within two business days.</p></div></main></MarketingShell>}
