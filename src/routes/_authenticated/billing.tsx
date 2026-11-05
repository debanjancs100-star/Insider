import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery } from "@tanstack/react-query";
import { SiteNav } from "@/components/site/SiteNav";
import { RoleGate } from "@/components/site/RoleGate";
import { PLANS } from "@/routes/pricing";
import { setSubscriptionTier, getMySubscription } from "@/lib/dev.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/billing")({
  head: () => ({ meta: [{ title: "Billing — INSIDER" }] }),
  component: () => (
    <RoleGate allow="company" redirectTo="/dashboard" message="Developer accounts don't have paid plans.">
      <Billing />
    </RoleGate>
  ),
});

function Billing() {
  const { data: sub, refetch } = useQuery({ queryKey: ["my-sub"], queryFn: () => getMySubscription() });
  const set = useMutation({
    mutationFn: (tier: "studio" | "practice" | "atelier") => setSubscriptionTier({ data: { tier } }),
    onSuccess: () => { toast.success("Plan updated"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="p-6 md:p-8">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-2">Billing</p>
        <h1 className="text-4xl font-serif italic mb-8">Choose your plan</h1>
        <p className="text-xs text-muted-foreground mb-8">
          Current plan: <span className="text-white uppercase tracking-widest">{sub?.subscription_tier || "None"}</span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl">
          {PLANS.map((p) => {
            const active = sub?.subscription_tier === p.tier;
            return (
              <div key={p.tier} className={`p-6 border ${active ? "border-brand" : "border-border"} bg-card`}>
                <h3 className="text-2xl font-serif italic mb-2">{p.name}</h3>
                <div className="mb-4">
                  <span className="text-3xl font-medium">${p.price}</span>
                  <span className="text-xs text-muted-foreground ml-2">/mo</span>
                </div>
                <ul className="space-y-2 mb-6 text-xs">
                  {p.features.map((f) => (<li key={f}>→ {f}</li>))}
                </ul>
                <button
                  onClick={() => set.mutate(p.tier)}
                  disabled={active || set.isPending}
                  className={`w-full py-2 text-[10px] uppercase tracking-widest font-bold transition-all ${active ? "border border-brand text-brand" : "bg-brand text-white hover:brightness-110"} disabled:opacity-50`}
                >
                  {active ? "Current plan" : "Activate"}
                </button>
              </div>
            );
          })}
        </div>
        <p className="mt-8 text-xs text-muted-foreground max-w-xl">
          Live card billing via Stripe can be enabled at any time. Plans currently activate instantly for testing.
        </p>
      </div>
    </div>
  );
}
