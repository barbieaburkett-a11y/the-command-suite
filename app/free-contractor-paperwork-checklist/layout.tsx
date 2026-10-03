import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free Contractor Paperwork Leak Check | The Command Suite',
  description: 'Score ten field-to-office handoffs and find where texts, photos, receipts, change orders, and approvals are leaking out of your construction business.',
  alternates: { canonical: 'https://thecommandsuite.com/free-contractor-paperwork-checklist' },
  openGraph: { title:'Free Contractor Paperwork Leak Check', description:'Find the field-to-office handoff costing your construction business the most follow-up and duplicate entry.', url:'https://thecommandsuite.com/free-contractor-paperwork-checklist' },
};

export default function Layout({children}:{children:React.ReactNode}){return children;}
