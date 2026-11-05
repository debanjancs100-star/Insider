import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProjectCard } from "@/components/site/ProjectCard";
import { listPublishedProjects } from "@/lib/projects.functions";
import heroTower from "@/assets/hero-tower.jpg";
import showcaseModel from "@/assets/showcase-model.jpg";
import blueprintDetail from "@/assets/blueprint-detail.jpg";
import interiorPenthouse from "@/assets/interior-penthouse.jpg";

const projectsQuery = queryOptions({
  queryKey: ["published-projects"],
  queryFn: () => listPublishedProjects(),
});

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "INSIDER — Architectural marketplace for off-plan real estate" },
      {
        name: "description",
        content:
          "Browse pre-construction developments with 3D floor plans, verified pricing, and construction timelines. Curated for buyers and investors.",
      },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(projectsQuery),
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">
      {error instanceof Error ? error.message : String(error)}
    </div>
  ),
  notFoundComponent: () => <div className="p-10">Not found</div>,
  component: Home,
});

function Home() {
  const { data: projects } = useSuspenseQuery(projectsQuery);

  return (
    <div className="min-h-screen">
      <SiteNav />

      {/* HERO */}
      <section className="relative border-b border-border overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px]">
          {/* Left: hero copy over image */}
          <div className="relative min-h-[80vh] flex flex-col justify-between p-6 md:p-10">
            <img
              src={heroTower}
              alt="Modern residential tower at dusk"
              width={1600}
              height={1200}
              className="absolute inset-0 w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-surface/60 via-surface/40 to-surface" />
            <div className="absolute inset-0 bg-gradient-to-r from-surface/80 via-transparent to-transparent" />

            <div className="relative z-10">
              <p className="text-brand text-xs font-bold uppercase tracking-[0.3em]">
                Marketplace of Building Intent — Vol. 07
              </p>
            </div>

            <div className="relative z-10">
              <h1 className="text-6xl md:text-8xl lg:text-9xl leading-[0.9] font-serif italic font-normal tracking-tight max-w-4xl">
                Preview the buildings <br /> that don't yet exist.
              </h1>
              <p className="max-w-md text-white/80 mt-8 text-sm leading-relaxed">
                INSIDER is the curated marketplace for pre-construction developments. Explore floor plans in 3D, launch full walkthroughs, and reserve residences before the crane leaves the site.
              </p>
              <div className="flex flex-wrap gap-3 mt-10">
                <a href="#marketplace" className="px-6 py-3 bg-brand text-white text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all">
                  Browse Marketplace
                </a>
                <Link to="/developers" className="px-6 py-3 border border-white/40 backdrop-blur-sm text-xs uppercase tracking-[0.2em] font-bold hover:bg-white hover:text-black transition-all">
                  For Developers
                </Link>
              </div>
            </div>
          </div>

          {/* Right: live index */}
          <aside className="bg-card p-6 border-l border-border flex flex-col justify-between">
            <div>
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium">
                LIVE INDEX
              </span>
              <div className="my-6 border-t border-border" />
              <div className="grid grid-cols-2 gap-6">
                <Stat label="Active listings" value={String(projects.length)} />
                <Stat label="Verified developers" value="12" />
                <Stat label="3D models loaded" value={String(projects.filter((p: any) => p.cover_url).length)} />
                <Stat label="Cities live" value="8" />
              </div>

              <div className="my-6 border-t border-border" />
              <div className="aspect-[4/3] overflow-hidden outline outline-1 -outline-offset-1 outline-white/5">
                <img
                  src={blueprintDetail}
                  alt="Architectural blueprint overlay"
                  loading="lazy"
                  width={1200}
                  height={912}
                  className="w-full h-full object-cover"
                />
              </div>
              <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-3">
                Every plan · Verified at source
              </p>
            </div>

            <div>
              <div className="my-6 border-t border-border" />
              <p className="text-xs text-muted-foreground mb-4">
                Every listing is uploaded by the developer who owns it. Buyers browse — only the developer can update pricing, 3D models, and walkthrough access.
              </p>
              <Link to="/pricing" className="text-xs text-brand uppercase tracking-widest font-bold hover:underline">
                Read the developer covenant →
              </Link>
            </div>
          </aside>
        </div>
      </section>

      {/* SHOWCASE STRIP */}
      <section className="border-b border-border grid grid-cols-1 md:grid-cols-2">
        <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden group">
          <img
            src={showcaseModel}
            alt="Isometric architectural massing model"
            loading="lazy"
            width={1408}
            height={1008}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-10">
            <p className="text-brand text-[10px] uppercase tracking-[0.3em] font-bold mb-3">01 — Massing</p>
            <h3 className="text-3xl md:text-4xl font-serif italic">Study the volume before the pour.</h3>
          </div>
        </div>
        <div className="relative aspect-[4/3] md:aspect-auto overflow-hidden group">
          <img
            src={interiorPenthouse}
            alt="Luxury penthouse interior at sunset"
            loading="lazy"
            width={1408}
            height={1008}
            className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-700"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-surface/90 via-surface/20 to-transparent" />
          <div className="absolute bottom-0 left-0 p-6 md:p-10">
            <p className="text-brand text-[10px] uppercase tracking-[0.3em] font-bold mb-3">02 — Interior</p>
            <h3 className="text-3xl md:text-4xl font-serif italic">Walk the finish, not the renderer.</h3>
          </div>
        </div>
      </section>

      {/* PROCESS ROW */}
      <section className="p-6 md:p-10 border-b border-border grid grid-cols-1 md:grid-cols-3 gap-8">
        {[
          { n: "01", t: "Verified developer", d: "Every account is reviewed. Only the project owner can post, update, or replace assets." },
          { n: "02", t: "3D at source", d: "Native GLB models and walkthrough links stream from the developer's own upload — never third-party mockups." },
          { n: "03", t: "Reserve early", d: "Contact developers directly with pricing, timeline, and unit availability before public launch." },
        ].map((s) => (
          <div key={s.n}>
            <p className="text-brand text-xs font-bold tracking-[0.3em]">{s.n}</p>
            <h4 className="text-2xl font-serif italic mt-3 mb-2">{s.t}</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
          </div>
        ))}
      </section>

      {/* LISTINGS */}
      <section id="marketplace" className="p-6 md:p-10 border-b border-border">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-brand text-[10px] uppercase tracking-[0.3em] font-bold mb-2">The Marketplace</p>
            <h2 className="text-3xl md:text-5xl font-serif italic">Current listings</h2>
          </div>
          <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
            {projects.length} developments
          </span>
        </div>
        {projects.length === 0 ? (
          <div className="relative overflow-hidden border border-dashed border-border">
            <img
              src={showcaseModel}
              alt=""
              loading="lazy"
              className="absolute inset-0 w-full h-full object-cover opacity-15"
            />
            <div className="relative p-16 text-center">
              <p className="text-brand text-[10px] uppercase tracking-[0.3em] font-bold mb-4">Opening soon</p>
              <h3 className="text-3xl md:text-4xl font-serif italic mb-6 max-w-xl mx-auto">
                Be the first company to publish a project.
              </h3>
              <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
                Curated developers get first placement, verified badges, and priority in the Vol. 07 index.
              </p>
              <Link to="/developers" className="inline-block px-6 py-3 bg-brand text-white text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all">
                List your project
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p: any) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        )}
      </section>

      <SiteFooter />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">{label}</div>
      <div className="text-3xl font-serif italic">{value}</div>
    </div>
  );
}
