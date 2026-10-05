import type { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://thecommandsuite.com';
  return [
    { url: `${base}/`, lastModified: new Date('2026-09-29'), changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/front-desk`, lastModified: new Date('2026-10-05'), changeFrequency: 'weekly', priority: 0.95 },
    { url: `${base}/trial`, lastModified: new Date('2026-10-05'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/see-it-done`, lastModified: new Date('2026-10-05'), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/product`, lastModified: new Date('2026-09-29'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/command-inbox`, lastModified: new Date('2026-09-29'), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/how-it-works`, lastModified: new Date('2026-09-29'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/pricing`, lastModified: new Date('2026-09-29'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/permit-pathfinder`, lastModified: new Date('2026-09-22'), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/resources`, lastModified: new Date('2026-09-22'), changeFrequency: 'weekly', priority: 0.7 },
    { url: `${base}/contact`, lastModified: new Date('2026-09-22'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/privacy`, lastModified: new Date('2026-09-01'), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/terms`, lastModified: new Date('2026-09-01'), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${base}/sms-opt-in`, lastModified: new Date('2026-09-01'), changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/contractor-daily-logs`, lastModified: new Date('2026-09-06'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/construction-change-orders`, lastModified: new Date('2026-09-06'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/contractor-receipt-capture`, lastModified: new Date('2026-09-06'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/free-contractor-paperwork-checklist`, lastModified: new Date('2026-09-06'), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/trust`, lastModified: new Date('2026-09-08'), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/jobsite-photo-documentation`, lastModified: new Date('2026-09-08'), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/jobtread-field-intake`, lastModified: new Date('2026-09-08'), changeFrequency: 'monthly', priority: 0.75 },
  ];
}
