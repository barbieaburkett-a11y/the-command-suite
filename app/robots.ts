import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/command$', '/command/', '/customer-login', '/welcome', '/internal/', '/partner/', '/crew/', '/inspector-sync/', '/permit-runner/', '/trial-ended'],
    },
    sitemap: 'https://thecommandsuite.com/sitemap.xml',
    host: 'https://thecommandsuite.com',
  };
}
