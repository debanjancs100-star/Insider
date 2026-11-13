import { useEffect, useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { SiteNav } from '../components/SiteNav';
import { Field } from '../components/Field';
import { FileUploader } from '../components/FileUploader';
import { api, client, must } from '../lib/amplify';
import { useAuth } from '../lib/auth';
import { ensureProfile } from '../lib/developer';
import { httpUrlError, slugify } from '../lib/format';
import { useAsync, useMediaUrl } from '../lib/hooks';

export default function ProfilePage() {
  const { ownerGroup } = useAuth();
  const { data: profile, reload } = useAsync(() => ensureProfile(ownerGroup!, 'My company'), [ownerGroup]);
  const [f, setF] = useState({ companyName: '', slug: '', website: '', contactEmail: '', bio: '', logoPath: null as string | null });
  const [saving, setSaving] = useState(false);
  const logo = useMediaUrl(f.logoPath);

  useEffect(() => {
    if (!profile) return;
    setF({
      companyName: profile.companyName, slug: profile.slug || slugify(profile.companyName), website: profile.website || '',
      contactEmail: profile.contactEmail || '', bio: profile.bio || '', logoPath: profile.logoPath ?? null,
    });
  }, [profile]);

  const save = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const err = httpUrlError(f.website);
      if (err) throw new Error(`Website: ${err}`);
      const chk = await api.slugAvailable('profile', f.slug);
      if (!chk.available) throw new Error(chk.reason ?? 'That URL slug is already taken.');
      must(await client.models.Profile.update({
        ownerGroup: ownerGroup!, companyName: f.companyName.trim(), slug: f.slug, website: f.website.trim() || null,
        contactEmail: f.contactEmail.trim() || null, bio: f.bio.trim() || null, logoPath: f.logoPath,
      }));
      toast.success('Profile saved');
      reload();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  return (
    <div className="min-h-screen">
      <title>Company profile — INSIDER</title>
      <SiteNav />
      <div className="p-6 md:p-8 max-w-2xl">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-2">Company profile</p>
        <h1 className="text-4xl font-serif italic mb-8">How buyers see you</h1>
        <form onSubmit={save} className="space-y-6">
          <FileUploader label="Logo" kind="logos" accept="image/*" maxSizeMB={2} currentPath={f.logoPath} onUploaded={(p) => setF({ ...f, logoPath: p })} />
          {logo && <img src={logo} alt="Logo" className="w-24 h-24 object-cover border border-border" />}
          <Field label="Company name" value={f.companyName} required onChange={(v) => setF({ ...f, companyName: v, slug: f.slug || slugify(v) })} />
          <Field label="URL slug" value={f.slug} onChange={(v) => setF({ ...f, slug: slugify(v) })} />
          <Field label="Website" value={f.website} placeholder="https://…" onChange={(v) => setF({ ...f, website: v })} />
          <Field label="Contact email" type="email" value={f.contactEmail} onChange={(v) => setF({ ...f, contactEmail: v })} />
          <Field label="Bio" multiline value={f.bio} onChange={(v) => setF({ ...f, bio: v })} />
          <button type="submit" disabled={saving} className="px-6 py-3 bg-brand text-white text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all disabled:opacity-50">{saving ? 'Saving…' : 'Save profile'}</button>
        </form>
      </div>
    </div>
  );
}
