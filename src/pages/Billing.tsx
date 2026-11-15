import { useState } from 'react';
import { toast } from 'sonner';
import { SiteNav } from '../components/SiteNav';
import { client, api, must } from '../lib/amplify';
import { useAuth } from '../lib/auth';
import { useAsync } from '../lib/hooks';
import { PLANS } from '../lib/plans';

export default function Billing() {
  const { sub } = useAuth();
  const { data: sub_, reload } = useAsync(async () => (await must(await client.models.UserSubscription.get({ id: sub! }))).data, [sub]);
  const [busy, setBusy] = useState(false);

  const choose = async (tier: string) => {
    setBusy(true);
    try { await api.setTier(tier); toast.success('Plan updated'); setTimeout(reload, 400); }
    catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen">
      <title>Billing — INSIDER</title>
      <SiteNav />
      <div className="p-6 md:p-8">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-2">Billing</p>
        <h1 className="text-4xl font-serif italic mb-8">Choose your plan</h1>
        <p className="text-xs text-muted-foreground mb-8">Current plan: <span className="text-white uppercase tracking-widest">{sub_?.tier || 'None'}</span></p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
          {PLANS.map((p) => {
            const active = sub_?.tier === p.tier;
            return (
              <div key={p.tier} className={`p-6 border bg-card ${active ? 'border-brand' : 'border-border'}`}>
                <h3 className="text-2xl font-serif italic mb-2">{p.name}</h3>
                <div className="mb-4"><span className="text-3xl font-medium">${p.price}</span><span className="text-xs text-muted-foreground ml-2">/mo</span></div>
                <ul className="space-y-2 mb-6 text-xs">{p.features.map((f) => <li key={f}>→ {f}</li>)}</ul>
                <button onClick={() => choose(p.tier)} disabled={active || busy}
                  className={`w-full py-2 text-[10px] uppercase tracking-widest font-bold transition-all ${active ? 'border border-brand text-brand' : 'bg-brand text-white hover:brightness-110'} disabled:opacity-50`}>
                  {active ? 'Current plan' : 'Activate'}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-xs text-muted-foreground max-w-xl">Card billing (Stripe) is not enabled in this build. Plan changes are only accepted when the deployment sets BILLING_MODE=test.</p>
      </div>
    </div>
  );
}
