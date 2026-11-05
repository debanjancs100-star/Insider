import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteNav } from "@/components/site/SiteNav";
import { RoleGate } from "@/components/site/RoleGate";
import { FileUploader } from "@/components/dashboard/FileUploader";
import { getMyProfile, updateMyProfile } from "@/lib/dev.functions";
import { slugify } from "@/lib/utils/url";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/profile")({
  head: () => ({ meta: [{ title: "Company profile — INSIDER" }] }),
  component: () => (
    <RoleGate allow="developer" message="Only invited developers can edit company profiles.">
      <ProfilePage />
    </RoleGate>
  ),
});

function ProfilePage() {
  const { data: profile, refetch } = useQuery({ queryKey: ["my-profile"], queryFn: () => getMyProfile() });
  const [form, setForm] = useState({ company_name: "", slug: "", website: "", contact_email: "", bio: "", logo_url: null as string | null });
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        company_name: profile.company_name || "",
        slug: profile.slug || slugify(profile.company_name || ""),
        website: profile.website || "",
        contact_email: profile.contact_email || "",
        bio: profile.bio || "",
        logo_url: profile.logo_url,
      });
      if (profile.logo_url) {
        supabase.storage.from("company-logos").createSignedUrl(profile.logo_url, 3600).then(({ data }) => {
          setLogoPreview(data?.signedUrl ?? null);
        });
      }
    }
  }, [profile]);

  const save = useMutation({
    mutationFn: () => updateMyProfile({ data: form }),
    onSuccess: () => { toast.success("Profile saved"); refetch(); },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen">
      <SiteNav />
      <div className="p-6 md:p-8 max-w-2xl">
        <p className="text-brand text-xs font-bold uppercase tracking-[0.3em] mb-2">Company profile</p>
        <h1 className="text-4xl font-serif italic mb-8">How buyers see you</h1>

        <form onSubmit={(e) => { e.preventDefault(); save.mutate(); }} className="space-y-6">
          <FileUploader
            label="Logo"
            bucket="company-logos"
            accept="image/*"
            maxSizeMB={2}
            currentPath={form.logo_url}
            onUploaded={(p) => {
              setForm({ ...form, logo_url: p });
              supabase.storage.from("company-logos").createSignedUrl(p, 3600).then(({ data }) => {
                setLogoPreview(data?.signedUrl ?? null);
              });
            }}
          />
          {logoPreview && <img src={logoPreview} alt="Logo" className="w-24 h-24 object-cover border border-border" />}

          <Field label="Company name" value={form.company_name} onChange={(v) => setForm({ ...form, company_name: v, slug: form.slug || slugify(v) })} />
          <Field label="URL slug" value={form.slug} onChange={(v) => setForm({ ...form, slug: slugify(v) })} />
          <Field label="Website" value={form.website} onChange={(v) => setForm({ ...form, website: v })} placeholder="https://…" />
          <Field label="Contact email" value={form.contact_email} onChange={(v) => setForm({ ...form, contact_email: v })} type="email" />
          <Field label="Bio" value={form.bio} onChange={(v) => setForm({ ...form, bio: v })} multiline />

          <button type="submit" disabled={save.isPending} className="px-6 py-3 bg-brand text-white text-xs uppercase tracking-widest font-bold hover:brightness-110 transition-all disabled:opacity-50">
            {save.isPending ? "Saving…" : "Save profile"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder, multiline }: { label: string; value: string; onChange: (v: string) => void; type?: string; placeholder?: string; multiline?: boolean }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-widest text-muted-foreground mb-2 font-medium">{label}</span>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={4} className="w-full bg-surface border border-border px-3 py-3 text-sm focus:border-brand focus:outline-none" />
      ) : (
        <input type={type} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} className="w-full bg-surface border border-border px-3 py-3 text-sm focus:border-brand focus:outline-none" />
      )}
    </label>
  );
}
