import { useEffect, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { SiteNav } from '../components/SiteNav';
import { Field } from '../components/Field';
import { FileUploader } from '../components/FileUploader';
import { api, client, must, parseJson, type GalleryItem, type Milestone } from '../lib/amplify';
import { useAuth } from '../lib/auth';
import { httpUrlError, slugify } from '../lib/format';
import { useAsync } from '../lib/hooks';

const num = (s: string) => (s.trim() === '' ? null : Number(s));
const blank = { title: '', slug: '', location: '', description: '', coverPath: null as string | null, modelPath: null as string | null, walkthroughUrl: '', priceFrom: '', priceTo: '', currency: 'USD', unitsTotal: '', unitsRemaining: '', status: 'published' };

export default function EditProject() {
  const { id = 'new' } = useParams();
  const isNew = id === 'new';
  const nav = useNavigate();
  const { ownerGroup } = useAuth();
  const { data } = useAsync(async () => (isNew ? null : must(await client.models.Project.get({ id })).data), [id]);

  const [f, setF] = useState(blank);
  const [ms, setMs] = useState<Milestone[]>([]);
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [saving, setSaving] = useState(false);
  const urlError = httpUrlError(f.walkthroughUrl);

  useEffect(() => {
    if (!data) return;
    setF({
      title: data.title, slug: data.slug, location: data.location ?? '', description: data.description ?? '', coverPath: data.coverPath ?? null,
      modelPath: data.modelPath ?? null, walkthroughUrl: data.walkthroughUrl ?? '', priceFrom: data.priceFrom?.toString() ?? '',
      priceTo: data.priceTo?.toString() ?? '', currency: data.currency ?? 'USD', unitsTotal: data.unitsTotal?.toString() ?? '',
      unitsRemaining: data.unitsRemaining?.toString() ?? '', status: data.status ?? 'draft',
    });
    setMs(parseJson<Milestone[]>(data.milestones, []));
    setGallery(parseJson<GalleryItem[]>(data.gallery, []));
  }, [data]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (urlError) throw new Error(`Walkthrough URL: ${urlError}`);
      const slug = f.slug || slugify(f.title);
      const [pf, pt, ut, ur] = [num(f.priceFrom), num(f.priceTo), num(f.unitsTotal), num(f.unitsRemaining)];
      if ([pf, pt, ut, ur].some((n) => n !== null && (!Number.isFinite(n) || n < 0))) throw new Error('Prices and unit counts must be non-negative numbers.');
      if (pf !== null && pt !== null && pt < pf) throw new Error('"Price to" must be at least "Price from".');
      if (ut !== null && ur !== null && ur > ut) throw new Error('Units remaining cannot exceed total units.');
      if (ms.some((m) => !m.label.trim() || !m.date)) throw new Error('Every milestone needs a label and a date.');
      const chk = await api.slugAvailable('project', slug, isNew ? undefined : id);
      if (!chk.available) throw new Error(chk.reason ?? 'That URL slug is already taken.');

      const body = {
        slug, title: f.title.trim(), location: f.location.trim(), description: f.description.trim(), coverPath: f.coverPath, modelPath: f.modelPath,
        walkthroughUrl: f.walkthroughUrl.trim() || null, priceFrom: pf, priceTo: pt, currency: f.currency.toUpperCase().slice(0, 3),
        unitsTotal: ut === null ? null : Math.trunc(ut), unitsRemaining: ur === null ? null : Math.trunc(ur), status: f.status,
        milestones: ms.map((m) => ({ label: m.label.trim(), date: m.date })).sort((a, b) => a.date.localeCompare(b.date)),
        gallery,
      };
      // One item, one write: milestones and gallery travel with the project (atomic, unlike delete-then-insert).
      must(isNew ? await client.models.Project.create({ ownerGroup: ownerGroup!, ...body } as any) : await client.models.Project.update({ id, ...body } as any));
      toast.success('Saved');
      nav('/dashboard');
    } catch (err: any) { toast.error(err.message); } finally { setSaving(false); }
  };

  const setMsAt = (i: number, patch: Partial<Milestone>) => setMs(ms.map((m, j) => (j === i ? { ...m, ...patch } : m)));
  const sel = 'w-full bg-surface border border-border px-3 py-3 text-sm';

  return (
    <div className="min-h-screen">
      <title>Edit project — INSIDER</title>
      <SiteNav />
      <div className="p-6 md:p-8 max-w-3xl">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-2">{isNew ? 'New listing' : 'Edit listing'}</p>
        <h1 className="text-4xl font-serif italic mb-8">{f.title || 'Untitled project'}</h1>
        <form onSubmit={save} className="space-y-6">
          <Field label="Title" value={f.title} required onChange={(v) => setF({ ...f, title: v, slug: isNew && !f.slug ? slugify(v) : f.slug })} />
          <Field label="URL slug" value={f.slug} onChange={(v) => setF({ ...f, slug: slugify(v) })} />
          <Field label="Location" value={f.location} onChange={(v) => setF({ ...f, location: v })} />
          <Field label="Description" multiline value={f.description} onChange={(v) => setF({ ...f, description: v })} />
          <div className="grid grid-cols-2 gap-4">
            <Field label="Price from" type="number" value={f.priceFrom} onChange={(v) => setF({ ...f, priceFrom: v })} />
            <Field label="Price to" type="number" value={f.priceTo} onChange={(v) => setF({ ...f, priceTo: v })} />
            <Field label="Total units" type="number" value={f.unitsTotal} onChange={(v) => setF({ ...f, unitsTotal: v })} />
            <Field label="Units remaining" type="number" value={f.unitsRemaining} onChange={(v) => setF({ ...f, unitsRemaining: v })} />
          </div>
          <FileUploader label="Cover image" kind="covers" accept="image/*" maxSizeMB={5} currentPath={f.coverPath} onUploaded={(p) => setF({ ...f, coverPath: p })} />
          <FileUploader label="3D model (.glb / .gltf)" kind="models" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" maxSizeMB={250} currentPath={f.modelPath} onUploaded={(p) => setF({ ...f, modelPath: p })} description="Only you can upload or replace this file. Max 250MB." />
          <div>
            <Field label="Unreal Engine walkthrough URL" value={f.walkthroughUrl} placeholder="https://…" onChange={(v) => setF({ ...f, walkthroughUrl: v })} />
            {urlError && <p className="text-xs text-destructive mt-2">{urlError}</p>}
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Milestones</div>
            {ms.map((m, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input value={m.label} onChange={(e) => setMsAt(i, { label: e.target.value })} placeholder="Label" className="flex-1 bg-surface border border-border px-3 py-2 text-sm" />
                <input type="date" value={m.date} onChange={(e) => setMsAt(i, { date: e.target.value })} className="bg-surface border border-border px-3 py-2 text-sm" />
                <button type="button" onClick={() => setMs(ms.filter((_, j) => j !== i))} className="text-muted-foreground text-xs">✕</button>
              </div>
            ))}
            <button type="button" onClick={() => setMs([...ms, { label: '', date: '' }])} className="text-xs text-brand uppercase tracking-widest">+ Add milestone</button>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Interior gallery</div>
            {gallery.map((g, i) => (
              <div key={g.path} className="flex gap-2 mb-2 items-center">
                <span className="text-xs text-muted-foreground w-40 truncate">{g.path.split('/').pop()}</span>
                <input value={g.caption} onChange={(e) => setGallery(gallery.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} placeholder="Caption" className="flex-1 bg-surface border border-border px-3 py-2 text-sm" />
                <button type="button" onClick={() => setGallery(gallery.filter((_, j) => j !== i))} className="text-muted-foreground text-xs">✕</button>
              </div>
            ))}
            <FileUploader label="Add gallery image" kind="gallery" accept="image/*" maxSizeMB={5} currentPath={null} onUploaded={(p) => setGallery([...gallery, { path: p, caption: '' }])} />
          </div>

          <label className="block">
            <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">Status</span>
            <select value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })} className={sel}>
              <option value="draft">Draft (hidden)</option>
              <option value="published">Published (public)</option>
              <option value="sold_out">Sold out</option>
            </select>
          </label>

          <div className="flex gap-3">
            <button type="submit" disabled={saving} className="px-6 py-3 bg-brand text-white text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all disabled:opacity-50">{saving ? 'Saving…' : 'Save listing'}</button>
            <button type="button" onClick={() => nav('/dashboard')} className="px-6 py-3 border border-border text-xs uppercase tracking-widest hover:bg-white hover:text-black transition-all">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  );
}
