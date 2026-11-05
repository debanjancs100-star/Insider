import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";

export const Route = createFileRoute("/developers")({
  head: () => ({
    meta: [
      { title: "For Developers — INSIDER" },
      {
        name: "description",
        content:
          "List your pre-construction developments on INSIDER. Upload 3D floor plans, link Unreal Engine walkthroughs, and reach vetted buyers.",
      },
    ],
  }),
  component: Developers,
});

function Developers() {
  return (
    <div className="min-h-screen">
      <SiteNav />

      <section className="p-6 md:p-16 border-b border-border">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-6">For Construction Companies</p>
        <h1 className="text-5xl md:text-8xl font-serif italic leading-[0.95] max-w-5xl">
          Your building deserves <br /> more than a render.
        </h1>
        <p className="max-w-xl text-muted-foreground mt-8 text-sm">
          Upload your Blender model. Paste your Unreal Engine walkthrough link. Publish a listing that buyers can actually walk through — from anywhere.
        </p>
        <div className="flex gap-3 mt-10">
          <Link to="/auth" className="px-6 py-3 bg-brand text-white text-xs uppercase tracking-[0.2em] font-bold hover:brightness-110 transition-all">
            Enter your invite code
          </Link>
        </div>
        <p className="mt-6 text-xs text-muted-foreground max-w-xl">
          Developer accounts are invite-only. If you've been contacted by INSIDER, you were handed an
          invite code — enter it on the sign-up page to activate your studio.
        </p>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 border-b border-border">
        <Step n="01" title="Sign up" body="Create a company account. Add your name, logo, and bio." />
        <Step n="02" title="Upload models" body="Drag & drop .glb files exported from Blender. Buyers see them instantly." />
        <Step n="03" title="Publish" body="Paste the Unreal Engine walkthrough URL. Only you can update it." />
      </section>

      <section className="p-6 md:p-16">
        <h2 className="text-3xl md:text-5xl font-serif italic mb-8">Why developers list on INSIDER</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Feature title="You own the data" body="Only your account can upload or replace the 3D model, gallery, or walkthrough link. Buyers view — never edit." />
          <Feature title="One canonical listing" body="A single URL for the whole team to share. Verified pricing, live timeline, published on your terms." />
          <Feature title="No CMS to learn" body="Drop a .glb file. Paste a link. Ship a listing in ten minutes." />
          <Feature title="Cancel anytime" body="Monthly plans. Pause listings when a project sells out." />
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="p-6 md:p-10 border-r border-border last:border-r-0">
      <div className="text-brand text-[10px] uppercase tracking-widest font-bold mb-4">{n}</div>
      <h3 className="text-2xl font-serif italic mb-3">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="p-6 bg-card border border-border">
      <h3 className="text-lg font-medium mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground">{body}</p>
    </div>
  );
}
