import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';
import { Field } from '../components/Field';
import { api } from '../lib/amplify';
import { useAuth } from '../lib/auth';
import { ensureProfile } from '../lib/developer';

function Redeem() {
  const { refresh } = useAuth();
  const nav = useNavigate();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true);
    try {
      await api.redeemInvite(code);
      const s = await refresh(true);
      await ensureProfile(s.ownerGroup!, 'My company');
      toast.success('Welcome to the developer studio.');
      nav('/dashboard');
    } catch (e: any) { toast.error(e.message); } finally { setBusy(false); }
  };
  return (
    <div className="mt-10 max-w-sm space-y-4">
      <Field label="Developer invite code" value={code} onChange={setCode} />
      <button onClick={go} disabled={busy || !code} className="px-6 py-3 bg-brand text-white text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all disabled:opacity-50">Activate studio</button>
    </div>
  );
}

export default function Developers() {
  const { signedIn, isDeveloper } = useAuth();
  return (
    <div className="min-h-screen">
      <title>For Developers — INSIDER</title>
      <SiteNav />
      <section className="p-6 md:p-16 border-b border-border">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-6">For Construction Companies</p>
        <h1 className="text-5xl md:text-8xl font-serif italic leading-[0.95] max-w-5xl">Your building deserves <br /> more than a render.</h1>
        <p className="max-w-xl text-muted-foreground mt-8 text-sm">Upload your Blender model. Paste your Unreal Engine walkthrough link. Publish a listing that buyers can actually walk through — from anywhere.</p>
        {isDeveloper ? (
          <Link to="/dashboard" className="inline-block mt-10 px-6 py-3 bg-brand text-white text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all">Open your studio</Link>
        ) : signedIn ? <Redeem /> : (
          <Link to="/auth" className="inline-block mt-10 px-6 py-3 bg-brand text-white text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all">Enter your invite code</Link>
        )}
        <p className="mt-6 text-xs text-muted-foreground max-w-xl">Developer accounts are invite-only. If you've been contacted by INSIDER, you were handed an invite code.</p>
      </section>
      <section className="grid grid-cols-1 md:grid-cols-3 border-b border-border">
        {[['01', 'Sign up', 'Create a company account. Add your name, logo, and bio.'], ['02', 'Upload models', 'Drag & drop .glb files exported from Blender. Buyers see them instantly.'], ['03', 'Publish', 'Paste the Unreal Engine walkthrough URL. Only you can update it.']].map(([n, t, b]) => (
          <div key={n} className="p-6 md:p-10 border-r border-border last:border-r-0">
            <div className="text-brand text-[10px] uppercase tracking-widest font-bold mb-4">{n}</div>
            <h3 className="text-2xl font-serif italic mb-3">{t}</h3>
            <p className="text-sm text-muted-foreground">{b}</p>
          </div>
        ))}
      </section>
      <section className="p-6 md:p-16">
        <h2 className="text-3xl md:text-5xl font-serif italic mb-8">Why developers list on INSIDER</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[['You own the data', 'Only your account can upload or replace the 3D model, gallery, or walkthrough link. Buyers view — never edit.'], ['One canonical listing', 'A single URL for the whole team to share. Verified pricing, live timeline, published on your terms.'], ['No CMS to learn', 'Drop a .glb file. Paste a link. Ship a listing in ten minutes.'], ['Cancel anytime', 'Pause listings when a project sells out.']].map(([t, b]) => (
            <div key={t} className="p-6 bg-card border border-border"><h3 className="text-lg font-medium mb-2">{t}</h3><p className="text-sm text-muted-foreground">{b}</p></div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </div>
  );
}
