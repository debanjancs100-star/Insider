import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { SiteNav } from "@/components/site/SiteNav";
import { RoleGate } from "@/components/site/RoleGate";
import { listMyProjects, deleteProject } from "@/lib/dev.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — INSIDER" }] }),
  component: () => (
    <RoleGate allow="developer" message="The developer studio is invite-only.">
      <Dashboard />
    </RoleGate>
  ),
});

function Dashboard() {
  const navigate = useNavigate();
  const { data: projects = [], refetch } = useQuery({
    queryKey: ["my-projects"],
    queryFn: () => listMyProjects(),
  });
  const del = useMutation({
    mutationFn: (id: string) => deleteProject({ data: { id } }),
    onSuccess: () => { toast.success("Deleted"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="p-6 md:p-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-2">Developer Studio</p>
            <h1 className="text-4xl font-serif italic">Your projects</h1>
          </div>
          <button
            onClick={() => navigate({ to: "/projects/new" })}
            className="px-5 py-3 bg-brand text-white text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all"
          >
            + New listing
          </button>
        </div>

        <div className="bg-card border border-border p-4 mb-8 text-xs text-muted-foreground">
          Your developer access is managed by INSIDER. Listings are unlimited and included with your invite.
        </div>

        <div className="flex items-center gap-4 mb-8">
          <Link to="/profile" className="text-xs uppercase tracking-widest text-muted-foreground hover:text-white transition-colors">
            → Edit company profile
          </Link>
        </div>

        {projects.length === 0 ? (
          <div className="border border-dashed border-border p-16 text-center">
            <p className="text-muted-foreground text-sm mb-6">No listings yet.</p>
            <button
              onClick={() => navigate({ to: "/projects/new" })}
              className="px-6 py-3 bg-brand text-white text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all"
            >
              Create your first listing
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {projects.map((p: any) => (
              <div key={p.id} className="bg-card border border-border p-4 flex items-center justify-between">
                <div>
                  <div className="font-medium">{p.title}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest mt-1">
                    {p.location} · {p.status}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {p.status === "published" && (
                    <Link
                      to="/projects/$slug"
                      params={{ slug: p.slug }}
                      className="text-xs uppercase tracking-widest text-muted-foreground hover:text-white transition-colors"
                    >
                      View
                    </Link>
                  )}
                  <Link
                    to="/projects/$id/edit"
                    params={{ id: p.id }}
                    className="px-4 py-2 border border-border text-[10px] uppercase tracking-widest hover:bg-white hover:text-black transition-all"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => confirm("Delete this listing?") && del.mutate(p.id)}
                    className="text-[10px] uppercase tracking-widest text-muted-foreground hover:text-destructive transition-colors"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
