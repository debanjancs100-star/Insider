import { createFileRoute, notFound, Link } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ThreeDViewer } from "@/components/site/ThreeDViewer";
import { getPublishedProject } from "@/lib/projects.functions";
import { formatMoneyRange, formatDate } from "@/lib/format";

const projectQuery = (slug: string) =>
  queryOptions({
    queryKey: ["project", slug],
    queryFn: () => getPublishedProject({ data: { slug } }),
  });

export const Route = createFileRoute("/projects/$slug")({
  head: ({ loaderData }) => {
    const p = (loaderData as any)?.project;
    return {
      meta: [
        { title: p ? `${p.title} — INSIDER` : "Listing — INSIDER" },
        {
          name: "description",
          content:
            p?.description?.slice(0, 155) ||
            "Pre-construction development with 3D floor plans and construction timeline.",
        },
        { property: "og:title", content: p?.title || "INSIDER Listing" },
        { property: "og:description", content: p?.description?.slice(0, 155) || "" },
        ...(p?.cover_url ? [{ property: "og:image", content: p.cover_url }] : []),
      ],
    };
  },
  loader: async ({ params, context }) => {
    const data = await context.queryClient.ensureQueryData(projectQuery(params.slug));
    if (!data) throw notFound();
    return data;
  },
  errorComponent: ({ error }) => (
    <div className="p-10 text-center text-muted-foreground">
      {error instanceof Error ? error.message : String(error)}
    </div>
  ),
  notFoundComponent: () => (
    <div className="p-16 text-center">
      <p className="text-brand text-xs uppercase tracking-widest mb-4">Listing unavailable</p>
      <h1 className="text-4xl font-serif italic mb-6">This project isn't published</h1>
      <Link to="/" className="text-brand text-xs uppercase tracking-widest hover:underline">
        ← Back to marketplace
      </Link>
    </div>
  ),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(projectQuery(slug));
  if (!data) return null;
  const { project, milestones, images, profile } = data;

  return (
    <div className="min-h-screen">
      <SiteNav />

      <div className="p-6 md:p-8 border-b border-border">
        <Link to="/" className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">
          ← Marketplace
        </Link>
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
          <div>
            <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-4">
              {project.location || "Location TBA"}
            </p>
            <h1 className="text-5xl md:text-7xl font-serif italic leading-none">{project.title}</h1>
            {profile && (
              <p className="text-xs uppercase tracking-widest text-muted-foreground mt-6">
                Developed by{" "}
                {profile.slug ? (
                  <Link to="/companies/$slug" params={{ slug: profile.slug }} className="text-white hover:text-brand transition-colors">
                    {profile.company_name}
                  </Link>
                ) : (
                  <span className="text-white">{profile.company_name}</span>
                )}
                {profile.verified && <span className="ml-2 text-brand">✓ Verified</span>}
              </p>
            )}
          </div>
          <div className="bg-card p-6 border border-border">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2">Pricing from</div>
            <div className="text-3xl font-serif italic text-brand mb-6">
              {formatMoneyRange(project.price_from, project.price_to, project.currency)}
            </div>
            {project.units_total != null && (
              <div className="grid grid-cols-2 gap-4 border-t border-border pt-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Units</div>
                  <div className="text-xl font-medium">{project.units_total}</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Remaining</div>
                  <div className="text-xl font-medium">{project.units_remaining ?? "—"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-6 md:p-8 grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-8">
          <ThreeDViewer
            modelUrl={project.model_url}
            walkthroughUrl={project.walkthrough_url}
            title={project.title}
          />

          {project.description && (
            <div>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">About the development</h2>
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{project.description}</p>
            </div>
          )}

          {images.length > 0 && (
            <div>
              <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Interior gallery</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {images.map((im: any) => (
                  <figure key={im.id} className="bg-card border border-border">
                    <img src={im.url} alt={im.caption ?? ""} className="w-full aspect-[4/3] object-cover" />
                    {im.caption && (
                      <figcaption className="p-3 text-xs text-muted-foreground">{im.caption}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-6">
          <div className="bg-card p-6 border border-border">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Construction timeline</h3>
            {milestones.length === 0 ? (
              <p className="text-xs text-muted-foreground">Timeline TBA.</p>
            ) : (
              <ol className="space-y-4">
                {milestones.map((m: any) => (
                  <li key={m.id} className="flex justify-between items-baseline border-b border-border pb-3 last:border-0">
                    <span className="text-sm">{m.label}</span>
                    <span className="text-[10px] uppercase tracking-widest text-brand">{formatDate(m.date)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="bg-card p-6 border border-border">
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Reserve interest</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Contact the developer directly for reservation terms and unit availability.
            </p>
            {profile?.slug && (
              <Link
                to="/companies/$slug"
                params={{ slug: profile.slug }}
                className="block w-full text-center py-3 border border-border text-[10px] uppercase tracking-widest font-bold hover:bg-white hover:text-black transition-all"
              >
                View developer
              </Link>
            )}
          </div>
        </aside>
      </div>

      <SiteFooter />
    </div>
  );
}
