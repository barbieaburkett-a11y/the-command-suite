'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { publicMarketing } from './public-marketing';

const nav = [
  ['Front Desk','/front-desk'],['Product','/product'],['Command Inbox','/command-inbox'],['How It Works','/how-it-works'],
  ['Pricing','/pricing'],['Resources','/resources'],
] as const;

export default function MarketingShell({children}:{children:ReactNode}){
  function track(event:string){void fetch('/api/events',{method:'POST',headers:{'content-type':'application/json'},keepalive:true,body:JSON.stringify({event,path:location.pathname})})}
  useEffect(()=>{if(location.pathname==='/pricing')track('pricing_viewed');if(location.pathname==='/permit-pathfinder')track('permit_pathfinder_viewed')},[]);
  return <div className="os-site">
    <a className="skip-link" href="#main-content">Skip to main content</a>
    <header className="os-nav"><div className="os-wrap os-nav-inner">
      <Link className="os-brand" href="/"><img src="/logo-brand.webp" alt="" width="35" height="35"/>The Command Suite</Link>
      <nav className="os-links" aria-label="Main navigation">{nav.map(([label,path])=><Link key={path} href={path}>{label}</Link>)}<Link href={publicMarketing.ctas.customer.href} onClick={()=>track('login_clicked')}>{publicMarketing.ctas.customer.label}</Link><Link className="os-button" href={publicMarketing.ctas.primary.href} onClick={()=>track('signup_clicked')}>{publicMarketing.ctas.primary.label}</Link></nav>
      <details><summary>Menu</summary><nav className="os-mobile-menu" aria-label="Mobile navigation">{nav.map(([label,path])=><Link key={path} href={path}>{label}</Link>)}<Link href={publicMarketing.ctas.customer.href} onClick={()=>track('login_clicked')}>{publicMarketing.ctas.customer.label}</Link><Link href={publicMarketing.ctas.primary.href} onClick={()=>track('signup_clicked')}>{publicMarketing.ctas.primary.label}</Link></nav></details>
    </div></header>
    {children}
    <footer className="os-footer"><div className="os-wrap os-footer-inner"><div><Link className="os-brand" href="/"><img src="/logo-brand.webp" alt="" width="35" height="35"/>The Command Suite</Link><p>{publicMarketing.footerDescription}</p></div><nav aria-label="Footer navigation"><Link href="/trial">Guided Trial</Link><Link href="/front-desk">Front Desk</Link><Link href="/product">Product</Link><Link href="/pricing">Pricing</Link><Link href="/permit-pathfinder">Permit Pathfinder</Link><Link href="/resources">Resources</Link><Link href="/trust">Trust</Link><Link href="/contact">Contact</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav><small>© 2026 The Command Suite. External sends, accounting posts, and government submissions stay review-gated or unavailable.</small></div></footer>
  </div>;
}
