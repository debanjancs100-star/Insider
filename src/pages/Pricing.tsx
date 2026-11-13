import { useNavigate } from 'react-router-dom';
import { SiteNav } from '../components/SiteNav';
import { SiteFooter } from '../components/SiteFooter';
import { useAuth } from '../lib/auth';
import { PLANS } from '../lib/plans';

export default function Pricing() {
  const nav = useNavigate();
  const { isDeveloper, signedIn } = useAuth();
  return (
    <div className="min-h-screen">
      <title>Plans for buyers — INSIDER</title>
      <SiteNav />
      <section className="p-6 md:p-16 border-b border-border text-center">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-6">Buyer Plans</p>
        <h1 className="text-5xl md:text-7xl font-serif italic leading-none">Browse on your terms</h1>
        <p className="max-w-xl mx-auto text-muted-foreground mt-6 text-sm">Monthly memberships for buyers. Cancel anytime. Developer studios are invite-only and separate from these plans.</p>
      </section>
      {isDeveloper && (
        <div className="p-6 md:p-16 max-w-3xl mx-auto">
          <div className="border border-border bg-card p-6 text-sm text-muted-foreground">You're signed in as a developer. These plans are for buyers — your listing tools are included with your invite.</div>
        </div>
      )}
      <section className="p-6 md:p-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {PLANS.map((p) => (
          <div key={p.tier} className={`p-8 border bg-card ${'featured' in p ? 'border-brand' : 'border-border'}`}>
            {'featured' in p && <span className="inline-block text-brand text-[10px] uppercase tracking-widest font-bold mb-4">Most Popular</span>}
            <h3 className="text-3xl font-serif italic mb-2">{p.name}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">{p.tagline}</p>
            <div className="mb-8"><span className="text-5xl font-medium">${p.price}</span><span className="text-xs text-muted-foreground uppercase tracking-widest ml-2">/ month</span></div>
            <ul className="space-y-3 mb-8">{p.features.map((f) => <li key={f} className="text-sm flex gap-2"><span className="text-brand">→</span> {f}</li>)}</ul>
            <button onClick={() => nav(signedIn ? '/billing' : '/auth')} disabled={isDeveloper}
              className={`block w-full text-center py-3 text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${'featured' in p ? 'bg-brand text-white hover:brightness-110' : 'border border-border hover:bg-white hover:text-black'}`}>
              {isDeveloper ? 'Not available for developers' : signedIn ? 'Choose plan' : 'Get started'}
            </button>
          </div>
        ))}
      </section>
      <SiteFooter />
    </div>
  );
}
