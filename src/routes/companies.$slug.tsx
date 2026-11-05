import { createFileRoute, notFound } from "@tanstack/react-router";
import { useSuspenseQuery, queryOptions } from "@tanstack/react-query";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { ProjectCard } from "@/components/site/ProjectCard";
import { getCompanyProfile } from "@/lib/projects.functions";

const q = (slug: string) => queryOptions({ queryKey: ["company", slug], queryFn: () => getCompanyProfile({ data: { slug } }) });

export const Route = createFileRoute("/companies/$slug")({
  head: ({ loaderData }) => ({
    meta: [
      { title: `${(loaderData as any)?.profile?.company_name || "Company"} — INSIDER` },
    ],
  }),
  loader: async ({ params, context }) => {
    const d = await context.queryClient.ensureQueryData(q(params.slug));
    if (!d) throw notFound();
    return d;
  },
  errorComponent: ({ error }) => (
    <div className="p-10">{error instanceof Error ? error.message : String(error)}</div>
  ),
  notFoundComponent: () => <div className="p-10">Company not found</div>,
  component: Company,
});

function Company() {
  const { slug } = Route.useParams();
  const { data } = useSuspenseQuery(q(slug));
  if (!data) return null;
  const { profile, projects } = data;

  return (
    <div className="min-h-screen">
      <SiteNav />
      <section className="p-6 md:p-16 border-b border-border">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-4">Verified developer</p>
        <div className="flex items-center gap-6">
          {profile.logo_url && (
            <img src={profile.logo_url} alt="" className="w-20 h-20 object-cover border border-border" />
          )}
          <div>
            <h1 className="text-5xl font-serif italic">{profile.company_name}</h1>
            {profile.website && (
              <a href={profile.website} target="_blank" rel="noopener noreferrer nofollow" className="text-xs text-brand uppercase tracking-widest hover:underline mt-2 inline-block">
                {profile.website}
              </a>
            )}
          </div>
        </div>
        {profile.bio && <p className="max-w-2xl text-sm text-muted-foreground mt-6">{profile.bio}</p>}
      </section>
      <section className="p-6 md:p-8">
        <h2 className="text-2xl font-serif italic mb-6">Current listings</h2>
        {projects.length === 0 ? (
          <p className="text-muted-foreground text-sm">No published listings.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projects.map((p: any) => <ProjectCard key={p.slug} project={p} />)}
          </div>
        )}
      </section>
      <SiteFooter />
    </div>
  );
}
