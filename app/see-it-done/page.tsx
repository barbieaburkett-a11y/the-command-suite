import type { Metadata } from 'next';
import Link from 'next/link';
import { showcaseProjects } from './projects';
import './showcase.css';

export const metadata: Metadata = {
  title: 'See It Done | The Command Suite',
  description: 'Visual project ideas, with a path to plan a DIY project or ask about subcontractor availability.',
  robots: { index: false, follow: false },
};

export default function ShowcaseIndex() {
  return <main className="showcase" id="main-content">
    <a className="skip-link" href="#showcase-grid">Skip to projects</a>
    <header className="showcase-header"><Link href="/" className="showcase-brand">THE COMMAND SUITE</Link><Link href="/">Contractor workflows ↗</Link></header>
    <div className="showcase-wrap">
      <p className="showcase-kicker">PROJECT IDEAS · PREVIEW</p>
      <h1>See what could be done.</h1>
      <p className="showcase-intro">Explore a design idea, plan your own DIY version, or ask whether a Command Suite subcontractor is available for a similar project. AI concept videos show possibilities—not real customer jobs, exact materials, quotes, or guaranteed outcomes.</p>
      <div className="showcase-grid" id="showcase-grid">
        {showcaseProjects.map(project => <Link className="showcase-card" href={`/see-it-done/${project.id}`} key={project.id}>
          {project.conceptVideo ? <div className="showcase-card-poster"><img src={project.conceptVideo.poster} alt={project.conceptVideo.posterAlt} loading="lazy"/><span>AI CONCEPT VIDEO</span></div> : <div className="showcase-media" role="img" aria-label={`Media has not been supplied for ${project.title}`}><span>MORE IDEAS COMING</span></div>}
          <div className="showcase-card-body"><span className="showcase-tag">{project.conceptVideo ? 'AI CONCEPT' : 'COMING SOON'} · {project.category.toUpperCase()}</span><h2>{project.title}</h2><p>{project.summary}</p><strong>{project.conceptVideo ? 'Watch the idea →' : 'View placeholder →'}</strong></div>
        </Link>)}
      </div>
      <p className="showcase-next">Bathroom transformation: coming when the concept video is ready.</p>
      <p className="showcase-boundary">This homeowner idea gallery is separate from The Command Suite’s contractor workflow pilot. A service inquiry is not a booking; scope, code requirements, location, and subcontractor availability must be confirmed.</p>
    </div>
  </main>;
}
