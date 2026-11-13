import { Link, useParams } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';
import { ThreeDViewer } from '../components/ThreeDViewer';
import { api, type GalleryItem } from '../lib/amplify';
import { useAsync, useMediaUrl } from '../lib/hooks';
import { formatDate, formatMoneyRange } from '../lib/format';

function GalleryImage({ item }: { item: GalleryItem }) {
  const url = useMediaUrl(item.path);
  return (
    <figure className="bg-card border border-border">
      {url ? <img src={url} alt={item.caption ?? ''} className="w-full aspect-[4/3] object-cover" /> : <div className="w-full aspect-[4/3] bg-surface" />}
      {item.caption && <figcaption className="p-3 text-xs text-muted-foreground">{item.caption}</figcaption>}
    </figure>
  );
}

export default function ProjectDetail() {
  const { slug = '' } = useParams();
  const { data, loading, error } = useAsync(() => api.getPublished(slug), [slug]);

  if (loading) return <div className="min-h-screen"><SiteNav /><p className="p-16 text-center text-xs uppercase tracking-widest text-muted-foreground">Loading…</p></div>;
  if (error) return <div className="p-10 text-center text-muted-foreground">{error.message}</div>;
  if (!data) {
    return (
      <div className="min-h-screen"><SiteNav />
        <div className="p-16 text-center">
          <p className="text-brand text-xs uppercase tracking-widest mb-4">Listing unavailable</p>
          <h1 className="text-4xl font-serif italic mb-6">This project isn't published</h1>
          <Link to="/" className="text-brand text-xs uppercase tracking-widest hover:underline">← Back to marketplace</Link>
        </div>
      </div>
    );
  }
  const { project, profile } = data;

  return (
    <div className="min-h-screen">
      <title>{`${project.title} — INSIDER`}</title>
      <meta name="description" content={project.description.slice(0, 155)} />
      <SiteNav />
      <div className="p-6 md:p-8 border-b border-border">
        <Link to="/" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">← Marketplace</Link>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          <div>
            <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-4">{project.location || 'Location TBA'}</p>
            <h1 className="text-5xl md:text-7xl font-serif italic leading-none">{project.title}</h1>
            {profile && (
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-6">
                Developed by{' '}
                {profile.slug ? <Link to={`/companies/${profile.slug}`} className="text-white hover:text-brand transition-colors">{profile.companyName}</Link> : <span className="text-white">{profile.companyName}</span>}
                {profile.verified && <span className="ml-2 text-brand">✓ Verified</span>}
              </p>
            )}
          </div>
          <div className="bg-card p-6 border border-border">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Pricing from</div>
            <div className="text-3xl font-serif italic text-brand mb-6">{formatMoneyRange(project.priceFrom, project.priceTo, project.currency)}</div>
            {project.unitsTotal != null && (
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Units</div><div className="text-xl font-medium">{project.unitsTotal}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-muted-foreground">Remaining</div><div className="text-xl font-medium">{project.unitsRemaining ?? '—'}</div></div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-8">
          <ThreeDViewer modelPath={project.modelPath} walkthroughUrl={project.walkthroughUrl} title={project.title} />
          {project.description && (
            <div>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">About the development</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>
          )}
          {project.gallery.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Interior gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{project.gallery.map((g) => <GalleryImage key={g.path} item={g} />)}</div>
            </div>
          )}
        </div>
        <aside className="space-y-6">
          <div className="bg-card p-6 border border-border">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Construction timeline</h3>
            {project.milestones.length === 0 ? <p className="text-xs text-muted-foreground">Timeline TBA.</p> : (
              <ol className="space-y-4">
                {project.milestones.map((m, i) => (
                  <li key={i} className="flex justify-between items-baseline border-b border-border pb-3 last:border-0">
                    <span className="text-sm">{m.label}</span>
                    <span className="text-[10px] uppercase tracking-widest text-brand">{formatDate(m.date)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
          <div className="bg-card p-6 border border-border">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Reserve interest</h3>
            <p className="text-xs text-muted-foreground mb-4">Contact the developer directly for reservation terms and unit availability.</p>
            {profile?.slug && <Link to={`/companies/${profile.slug}`} className="block w-full text-center py-3 border border-border text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all">View developer</Link>}
          </div>
        </aside>
      </div>
      <SiteFooter />
    </div>
  );
}
