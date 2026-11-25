import { Link } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';
import { ProjectCard } from '../components/ProjectCard';
import { api } from '../lib/amplify';
import { useAsync } from '../lib/hooks';

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className="text-3xl font-serif italic">{value}</div>
    </div>
  );
}

export default function Home() {
  const { data, loading, error } = useAsync(() => api.listPublished(), []);
  const projects = Array.isArray(data) ? data : [];
  // Real figures derived from the data (the original shipped hard-coded "12" and "8").
  const developers = new Set(projects.map((p) => p.developerSlug ?? p.developer).filter(Boolean)).size;
  const verified = new Set(projects.filter((p) => p.developerVerified).map((p) => p.developerSlug)).size;

  return (
    <div className="min-h-screen">
      <title>INSIDER — Architectural marketplace for off-plan real estate</title>
      <SiteNav />

      <section className="relative border-b border-border overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px]">
          <div className="relative min-h-[80vh] flex flex-col justify-between p-6 md:p-10 bg-gradient-to-br from-card via-surface to-surface">
            <p className="text-brand text-xs font-bold uppercase tracking-[0.3em]">Marketplace of Building Intent</p>
            <div>
              <h1 className="text-6xl md:text-8xl lg:text-9xl leading-[0.9] font-serif italic font-normal tracking-tight max-w-4xl">
                Preview the buildings <br /> that don't yet exist.
              </h1>
              <p className="max-w-md text-white/80 mt-8 text-sm leading-relaxed">
                INSIDER is the curated marketplace for pre-construction developments. Explore floor plans in 3D, launch full walkthroughs, and reserve residences before the crane leaves the site.
              </p>
              <div className="flex flex-wrap gap-3 mt-10">
                <a href="#marketplace" className="px-6 py-3 bg-brand text-white text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all">Browse Marketplace</a>
                <Link to="/developers" className="px-6 py-3 border border-white/40 text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-black transition-all">For Developers</Link>
              </div>
            </div>
          </div>

          <aside className="bg-card p-6 border-l border-border flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">LIVE INDEX</span>
              <div className="my-6 border-t border-border" />
              <div className="grid grid-cols-2 gap-6">
                <Stat label="Active listings" value={String(projects.length)} />
                <Stat label="Developers" value={String(developers)} />
                <Stat label="With 3D models" value={String(projects.filter((p) => p.hasModel).length)} />
                <Stat label="Verified" value={String(verified)} />
              </div>
            </div>
            <div>
              <div className="my-6 border-t border-border" />
              <p className="text-xs text-muted-foreground mb-4">
                Every listing is uploaded by the developer who owns it. Buyers browse — only the developer can update pricing, 3D models, and walkthrough access.
              </p>
              <Link to="/pricing" className="text-xs text-brand uppercase tracking-widest font-bold hover:underline">Read the developer covenant →</Link>
            </div>
          </aside>
        </div>
      </section>

      <section className="p-6 md:p-10 border-b border-border grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { n: '01', t: 'Verified developer', d: 'Every account is reviewed. Only the project owner can post, update, or replace assets.' },
          { n: '02', t: '3D at source', d: "Native GLB models and walkthrough links stream from the developer's own upload — never third-party mockups." },
          { n: '03', t: 'Reserve early', d: 'Contact developers directly with pricing, timeline, and unit availability before public launch.' },
        ].map((s) => (
          <div key={s.n}>
            <p className="text-brand text-xs font-bold tracking-[0.3em]">{s.n}</p>
            <h4 className="text-2xl font-serif italic mt-3 mb-2">{s.t}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
          </div>
        ))}
      </section>

      <section id="marketplace" className="p-6 md:p-10 border-b border-border">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-brand text-[10px] uppercase tracking-[0.3em] font-bold mb-2">The Marketplace</p>
            <h2 className="text-3xl md:text-5xl font-serif italic">Current listings</h2>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{projects.length} developments</span>
        </div>
        {error ? (
          <p className="text-center text-muted-foreground p-10">{error.message}</p>
        ) : loading ? (
          <p className="text-center text-muted-foreground p-10 text-xs uppercase tracking-widest">Loading…</p>
        ) : projects.length === 0 ? (
          <div className="border border-dashed border-border p-16 text-center">
            <p className="text-brand text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Opening soon</p>
            <h3 className="text-3xl md:text-4xl font-serif italic mb-6 max-w-xl mx-auto">Be the first company to publish a project.</h3>
            <Link to="/developers" className="inline-block px-6 py-3 bg-brand text-white text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all">List your project</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p) => <ProjectCard key={p.id} project={p} />)}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
