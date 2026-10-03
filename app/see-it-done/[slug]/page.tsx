import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getShowcaseProject, showcaseProjects } from '../projects';
import { ProjectInquiry } from './project-inquiry';
import '../showcase.css';

export function generateStaticParams() { return showcaseProjects.map(project => ({ slug: project.id })); }

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const project = getShowcaseProject(slug);
  if (!project) return { title: 'Project not found' };
  return {
    title: `${project.title} | See It Done`,
    description: project.summary,
    robots: project.sample ? { index: false, follow: false } : { index: true, follow: true },
    alternates: { canonical: `https://thecommandsuite.com/see-it-done/${project.id}` },
    openGraph: { title: project.title, description: project.summary, images: project.afterMedia ? [{ url: project.afterMedia.src, alt: project.afterMedia.alt }] : [] },
    twitter: { card: project.afterMedia ? 'summary_large_image' : 'summary', images: project.afterMedia ? [project.afterMedia.src] : [] },
  };
}

export default async function ProjectDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const project = getShowcaseProject(slug);
  if (!project) notFound();
  return <main className="showcase">
    <header className="showcase-header"><Link href="/" className="showcase-brand">THE COMMAND SUITE</Link><Link href="/see-it-done">← All projects</Link></header>
    <article className="showcase-wrap showcase-detail">
      <p className="showcase-kicker">{project.conceptVideo ? 'AI DESIGN CONCEPT · NOT A COMPLETED JOB' : project.sample ? 'PLACEHOLDER · NOT A REAL CUSTOMER PROJECT' : project.category.toUpperCase()}</p>
      <h1>{project.title}</h1><p className="showcase-intro">{project.summary}</p>
      <p className="showcase-location">{project.locationArea}{project.crew ? ` · Crew: ${project.crew}` : ''}</p>
      {project.conceptVideo ? <section className="showcase-concept" aria-label="Project concept video"><video controls playsInline preload="metadata" poster={project.conceptVideo.poster}><source src={project.conceptVideo.src} type="video/mp4"/>Your browser cannot play this video.</video><p>{project.conceptVideo.transcript}</p></section> : <div className="showcase-pair">
        {(['beforeMedia','afterMedia'] as const).map((key) => <figure key={key}>
          {project[key] ? <Image src={project[key].src} alt={project[key].alt} width={960} height={720} sizes="(max-width: 700px) 100vw, 50vw" loading="lazy"/> : <div className="showcase-media" role="img" aria-label={`${key === 'beforeMedia' ? 'Before' : 'After'} photo has not been supplied`}><span>{key === 'beforeMedia' ? 'BEFORE' : 'AFTER'} PHOTO PENDING</span></div>}
          <figcaption>{key === 'beforeMedia' ? 'Before' : 'After'}</figcaption>
        </figure>)}
      </div>}
      {project.conceptVideo && <div className="showcase-paths"><section><h2>Plan a DIY version</h2><p>Use the video as inspiration, then measure your space and check local requirements. A real project needs a design and materials chosen for your room; this video is not an installation guide.</p></section><section><h2>Ask about a subcontractor</h2><p>Tell us your location and scope. We can check whether a subcontractor is available to discuss a similar project. No crew, price, or start date is promised by this concept.</p><a href={`mailto:hello@thecommandsuite.com?subject=${encodeURIComponent(`Project inquiry: ${project.title}`)}`}>Email a project inquiry →</a></section></div>}
      <section className="showcase-materials" aria-labelledby="materials-heading"><h2 id="materials-heading">{project.conceptVideo ? 'Materials to verify' : 'Materials used'}</h2>
        <p>{project.conceptVideo ? 'This AI concept does not identify actual products or specifications. We will list materials only when they are verified for a real project.' : 'We may earn a commission from qualifying purchases through affiliate links. No verified product links are available for this sample.'}</p>
        <ul>{project.materials.map(item => <li key={item.name}><span>{item.name}{item.note ? ` — ${item.note}` : ''}</span>{item.amazonUrl && <a href={item.amazonUrl} target="_blank" rel="sponsored noopener noreferrer">View material ↗</a>}</li>)}</ul>
      </section>
      {project.sample ? <p className="showcase-boundary">{project.conceptVideo ? 'This video is an illustrative idea, not a contractor portfolio item or customer testimonial.' : 'This card is a placeholder, not a customer project.'} Any actual work would require a separate scope, site review, quote, and subcontractor confirmation.</p> : <ProjectInquiry project={project} />}
    </article>
  </main>;
}
