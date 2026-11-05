import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { useMyRole } from "@/hooks/use-role";

export const PLANS = [
  {
    tier: "studio" as const,
    name: "Explorer",
    price: 0,
    tagline: "Browse the marketplace",
    features: ["Public listings", "3D floor plans", "Verified pricing", "Save favorites"],
  },
  {
    tier: "practice" as const,
    name: "Insider",
    price: 49,
    tagline: "For serious buyers",
    features: ["Everything in Explorer", "Priority reservation windows", "Direct-to-developer messaging", "Full walkthrough access"],
    featured: true,
  },
  {
    tier: "atelier" as const,
    name: "Concierge",
    price: 249,
    tagline: "For portfolio buyers",
    features: ["Everything in Insider", "Personal INSIDER advisor", "Off-market opportunities", "Dedicated support"],
  },
];

export const Route = createFileRoute("/pricing")({
  head: () => ({
    meta: [
      { title: "Plans for buyers — INSIDER" },
      { name: "description", content: "Membership plans for buyers browsing pre-construction developments on INSIDER." },
    ],
  }),
  component: Pricing,
});

function Pricing() {
  const navigate = useNavigate();
  const { role, signedIn } = useMyRole();
  const isDeveloper = role === "developer";

  return (
    <div className="min-h-screen">
      <SiteNav />
      <section className="p-6 md:p-16 border-b border-border text-center">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-6">Buyer Plans</p>
        <h1 className="text-5xl md:text-7xl font-serif italic leading-none">Browse on your terms</h1>
        <p className="max-w-xl mx-auto text-muted-foreground mt-6 text-sm">
          Monthly memberships for buyers. Cancel anytime. Developer studios are invite-only and separate from these plans.
        </p>
      </section>

      {isDeveloper && (
        <div className="p-6 md:p-16 max-w-3xl mx-auto">
          <div className="border border-border bg-card p-6 text-sm text-muted-foreground">
            You're signed in as a developer. These plans are for buyers — your listing tools are
            included with your invite and don't require a paid plan.
          </div>
        </div>
      )}

      <section className="p-6 md:p-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {PLANS.map((plan) => (
          <div
            key={plan.tier}
            className={`p-8 border ${plan.featured ? "border-brand bg-card" : "border-border bg-card"}`}
          >
            {plan.featured && (
              <span className="inline-block text-brand text-[10px] uppercase tracking-widest font-bold mb-4">
                Most Popular
              </span>
            )}
            <h3 className="text-3xl font-serif italic mb-2">{plan.name}</h3>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-6">{plan.tagline}</p>
            <div className="mb-8">
              <span className="text-5xl font-medium">${plan.price}</span>
              <span className="text-xs text-muted-foreground uppercase tracking-widest ml-2">/ month</span>
            </div>
            <ul className="space-y-3 mb-8">
              {plan.features.map((f) => (
                <li key={f} className="text-sm flex gap-2">
                  <span className="text-brand">→</span> {f}
                </li>
              ))}
            </ul>
            <button
              onClick={() => navigate({ to: signedIn ? "/billing" : "/auth" })}
              disabled={isDeveloper}
              className={`block w-full text-center py-3 text-xs uppercase tracking-widest font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                plan.featured
                  ? "bg-brand text-white hover:brightness-110"
                  : "border border-border hover:bg-white hover:text-black"
              }`}
            >
              {isDeveloper ? "Not available for developers" : signedIn ? "Choose plan" : "Get started"}
            </button>
          </div>
        ))}
      </section>

      <SiteFooter />
    </div>
  );
}
