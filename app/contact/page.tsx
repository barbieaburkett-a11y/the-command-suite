import MarketingShell from '../MarketingShell';
import AccessLeadForm from '../customer-login/AccessLeadForm';

export const metadata={title:'Contact The Command Suite',description:'Ask about the Founding Partner guided trial or request a practical review of one contractor office handoff.',alternates:{canonical:'https://thecommandsuite.com/contact'}};

export default function ContactPage(){return <MarketingShell><main className="os-subpage" id="main-content"><div className="os-wrap"><div className="os-kicker">Contact</div><h1>Tell us what you need help with.</h1><p className="os-lead">Ask about Command Front Desk, the Front Desk and Command Suite bundle, or the field-to-office handoff that keeps breaking. Send a short description of what arrives from the field, what the office repeats, and the useful result you need. Please do not include private customer details, plans, or financial documents in this general inquiry.</p><div style={{maxWidth:760,marginTop:28}}><AccessLeadForm/></div><p className="os-small-note">Prefer email? <a href="mailto:hello@thecommandsuite.com">hello@thecommandsuite.com</a>. We normally reply within one business day.</p></div></main></MarketingShell>}
