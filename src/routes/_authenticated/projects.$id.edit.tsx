import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/site/SiteNav";
import { RoleGate } from "@/components/site/RoleGate";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { getMyProject, upsertProject } from "@/lib/dev.functions";
import { httpUrlSchema, slugify } from "@/lib/utils/url";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/projects/$id/edit")({
  head: () => ({ meta: [{ title: "Edit project — INSIDER" }] }),
  component: () => (
    <RoleGate allow="developer" message="Only invited developers can edit listings.">
      <EditProject />
    </RoleGate>
  ),
});

type Milestone = { label: string; date: string; order_index: number };
type Image = { url: string; caption: string; order_index: number };

function EditProject() {
  const { id } = useParams({ from: "/_authenticated/projects/$id/edit" });
  const navigate = useNavigate();
  const isNew = id === "new";

  const { data } = useQuery({
    queryKey: ["my-project", id],
    queryFn: () => (isNew ? Promise.resolve(null) : getMyProject({ data: { id } })),
    enabled: !isNew,
  });

  const [f, setF] = useState({
    title: "", slug: "", location: "", description: "",
    cover_url: null as string | null, model_url: null as string | null,
    walkthrough_url: "", price_from: "", price_to: "", currency: "USD",
    units_total: "", units_remaining: "",
    status: "draft" as "draft" | "published" | "sold_out",
  });
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [images, setImages] = useState<Image[]>([]);
  const [urlError, setUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.project) {
      const p = data.project;
      setF({
        title: p.title, slug: p.slug, location: p.location || "", description: p.description || "",
        cover_url: p.cover_url, model_url: p.model_url, walkthrough_url: p.walkthrough_url || "",
        price_from: p.price_from?.toString() || "", price_to: p.price_to?.toString() || "",
        currency: p.currency, units_total: p.units_total?.toString() || "",
        units_remaining: p.units_remaining?.toString() || "", status: p.status,
      });
      setMilestones(data.milestones.map((m: any) => ({ label: m.label, date: m.date, order_index: m.order_index })));
      setImages(data.images.map((i: any) => ({ url: i.url, caption: i.caption || "", order_index: i.order_index })));
    }
  }, [data]);

  const save = useMutation({
    mutationFn: () => {
      if (f.walkthrough_url) {
        const parsed = httpUrlSchema.safeParse(f.walkthrough_url);
        if (!parsed.success) throw new Error(parsed.error.issues[0].message);
      }
      return upsertProject({ data: {
        id: isNew ? undefined : id,
        title: f.title,
        slug: f.slug || slugify(f.title),
        location: f.location, description: f.description,
        cover_url: f.cover_url, model_url: f.model_url,
        walkthrough_url: f.walkthrough_url,
        price_from: f.price_from ? parseInt(f.price_from) : null,
        price_to: f.price_to ? parseInt(f.price_to) : null,
        currency: f.currency,
        units_total: f.units_total ? parseInt(f.units_total) : null,
        units_remaining: f.units_remaining ? parseInt(f.units_remaining) : null,
        status: f.status,
        milestones, images,
      }});
    },
    onSuccess: () => { toast.success("Saved"); navigate({ to: "/dashboard" }); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="p-6 md:p-8 max-w-3xl">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-2">
          {isNew ? "New listing" : "Edit listing"}
        </p>
        <h1 className="text-4xl font-serif italic mb-8">{f.title || "Untitled project"}</h1>

        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-6">
          <F label="Title" value={f.title} onChange={(v) => setF({ ...f, title: v, slug: f.slug || slugify(v) })} required />
          <F label="URL slug" value={f.slug} onChange={(v) => setF({ ...f, slug: slugify(v) })} />
          <F label="Location" value={f.location} onChange={(v) => setF({ ...f, location: v })} />
          <F label="Description" value={f.description} onChange={(v) => setF({ ...f, description: v })} multiline />

          <div className="grid grid-cols-2 gap-4">
            <F label="Price from" value={f.price_from} onChange={(v) => setF({ ...f, price_from: v })} type="number" />
            <F label="Price to" value={f.price_to} onChange={(v) => setF({ ...f, price_to: v })} type="number" />
            <F label="Total units" value={f.units_total} onChange={(v) => setF({ ...f, units_total: v })} type="number" />
            <F label="Units remaining" value={f.units_remaining} onChange={(v) => setF({ ...f, units_remaining: v })} type="number" />
          </div>

          <FileUploader
            label="Cover image"
            bucket="project-covers" accept="image/*" maxSizeMB={5}
            currentPath={f.cover_url}
            onUploaded={(p) => setF({ ...f, cover_url: p })}
          />

          <FileUploader
            label="3D model (.glb / .gltf)"
            bucket="project-models"
            accept=".glb,.gltf,model/gltf-binary,model/gltf+json"
            maxSizeMB={250}
            currentPath={f.model_url}
            onUploaded={(p) => setF({ ...f, model_url: p })}
            description="Only you can upload or replace this file. Max 250MB."
          />

          <div>
            <F
              label="Unreal Engine walkthrough URL"
              value={f.walkthrough_url}
              onChange={(v) => {
                setF({ ...f, walkthrough_url: v });
                if (!v) return setUrlError(null);
                const parsed = httpUrlSchema.safeParse(v);
                setUrlError(parsed.success ? null : parsed.error.issues[0].message);
              }}
              placeholder="https://…"
            />
            {urlError && <p className="text-xs text-destructive mt-2">{urlError}</p>}
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">
              Only you (the developer who owns this project) can set this link.
            </p>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Milestones</div>
            {milestones.map((m, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={m.label} onChange={(e) => setMilestones(milestones.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Label" className="flex-1 bg-surface border border-border px-3 py-2 text-sm" />
                <input type="date" value={m.date} onChange={(e) => setMilestones(milestones.map((x, j) => j === i ? { ...x, date: e.target.value } : x))} className="bg-surface border border-border px-3 py-2 text-sm" />
                <button type="button" onClick={() => setMilestones(milestones.filter((_, j) => j !== i))} className="text-muted-foreground text-xs">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => setMilestones([...milestones, { label: "", date: "", order_index: milestones.length }])} className="text-xs text-brand uppercase tracking-widest">+ Add milestone</button>
          </div>

          <div>
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Status</span>
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value as any })} className="w-full bg-surface border border-border px-3 py-3 text-sm">
              <option value="draft">Draft (hidden)</option>
              <option value="published">Published (public)</option>
              <option value="sold_out">Sold out</option>
            </select>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={save.isPending} className="px-6 py-3 bg-brand text-white text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all disabled:opacity-50">
              {save.isPending ? "Saving…" : "Save listing"}
            </button>
            <button type="button" onClick={() => navigate({ to: "/dashboard" })} className="px-6 py-3 border border-border text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function F({ label, value, onChange, type = "text", required, multiline, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; required?: boolean; multiline?: boolean; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full bg-surface border border-border px-3 py-3 text-sm focus:border-brand focus:outline-none" />
      ) : (
        <input type={type} value={value} required={required} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full bg-surface border border-border px-3 py-3 text-sm focus:border-brand focus:outline-none" />
      )}
    </label>
  );
}
