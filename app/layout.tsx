import type { Metadata } from 'next';
import './globals.css';
import './brand-theme.css';
import './operating-theme.css';
import './trial-funnel.css';
import { homepageFaq, publicMarketing } from './public-marketing';

export const metadata: Metadata = {
  metadataBase: new URL('https://thecommandsuite.com'),
  title: 'The Command Suite | Contractor CRM Built Around the Job',
  description: 'Manage customers, jobs, schedules, files, approvals and office follow-up in one connected contractor CRM workspace.',
  keywords: ['contractor CRM', 'contractor operating system', 'construction workflow', 'field to office', 'construction document automation'],
  applicationName: 'The Command Suite',
  referrer: 'origin-when-cross-origin',
  robots: { index: true, follow: true },
  openGraph: {
    title: 'The Command Suite',
    description: 'The contractor CRM built around the way work actually reaches the office.',
    url: 'https://thecommandsuite.com/',
    siteName: 'The Command Suite',
    locale: 'en_US',
    type: 'website',
    images: [{ url: '/og-command-suite-warm.png', width: 1728, height: 905, alt: 'The Command Suite contractor CRM organizes customers, jobs, schedules, Command Inbox updates, approvals, and files.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'The Command Suite',
    description: 'The contractor CRM built around the way work actually reaches the office.',
    images: ['/og-command-suite-warm.png'],
  },
  alternates: { canonical: 'https://thecommandsuite.com/' },
  manifest: '/manifest.webmanifest',
  icons: { icon: '/favicon.svg', apple: '/logo-brand.png' },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        <script type="application/ld+json" dangerouslySetInnerHTML={{__html: JSON.stringify({
          '@context':'https://schema.org',
          '@graph':[
            {'@type':'Organization','@id':'https://thecommandsuite.com/#organization',name:'The Command Suite',url:'https://thecommandsuite.com/',logo:'https://thecommandsuite.com/logo-brand.webp',email:'hello@thecommandsuite.com',founder:{'@type':'Person',name:'Barbie Burkett'},address:{'@type':'PostalAddress',addressLocality:'Rock Hill',addressRegion:'SC',addressCountry:'US'}},
            {'@type':'SoftwareApplication','@id':'https://thecommandsuite.com/#software',name:'The Command Suite',url:'https://thecommandsuite.com/',applicationCategory:'BusinessApplication',operatingSystem:'Web',description:publicMarketing.description,provider:{'@id':'https://thecommandsuite.com/#organization'},offers:{'@type':'Offer',price:'149',priceCurrency:'USD',description:'$149 per month after a 14-day free trial. Terms confirmed before payment.'}},
            {'@type':'WebSite','@id':'https://thecommandsuite.com/#website',url:'https://thecommandsuite.com/',name:'The Command Suite',publisher:{'@id':'https://thecommandsuite.com/#organization'}},
            {'@type':'FAQPage','@id':'https://thecommandsuite.com/#faq',mainEntity:homepageFaq.map(item=>({'@type':'Question',name:item.question,acceptedAnswer:{'@type':'Answer',text:item.answer}}))}
          ]
        })}} />
        {children}
      </body>
    </html>
  );
}
