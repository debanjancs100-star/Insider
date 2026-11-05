import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

function publicClient() {
  return createClient<Database>(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

// Sign a storage path into a long-lived URL (1 year) for public consumption.
async function signPath(
  client: ReturnType<typeof publicClient>,
  bucket: string,
  path: string | null | undefined,
): Promise<string | null> {
  if (!path) return null;
  // If it's already a full URL (e.g. signed URL previously stored), return as-is.
  if (/^https?:\/\//i.test(path)) return path;
  const { data } = await client.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
  return data?.signedUrl ?? null;
}

async function hydrateProject(client: ReturnType<typeof publicClient>, p: any) {
  const [cover, model] = await Promise.all([
    signPath(client, "project-covers", p.cover_url),
    signPath(client, "project-models", p.model_url),
  ]);
  return { ...p, cover_url: cover, model_url: model };
}

async function hydrateProfile(client: ReturnType<typeof publicClient>, p: any) {
  if (!p) return p;
  const logo = await signPath(client, "company-logos", p.logo_url);
  return { ...p, logo_url: logo };
}

export const listPublishedProjects = createServerFn({ method: "GET" }).handler(async () => {
  const c = publicClient();
  const { data, error } = await c
    .from("projects")
    .select("id, slug, title, location, cover_url, price_from, price_to, currency, status, owner_id, created_at")
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  const hydrated = await Promise.all((data ?? []).map((p) => hydrateProject(c, p)));
  return hydrated;
});

export const getPublishedProject = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const c = publicClient();
    const { data: project, error } = await c
      .from("projects")
      .select("*")
      .eq("slug", data.slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) return null;

    const [{ data: milestones }, { data: images }, { data: profile }] = await Promise.all([
      c.from("project_milestones").select("*").eq("project_id", project.id).order("order_index"),
      c.from("project_images").select("*").eq("project_id", project.id).order("order_index"),
      c.from("profiles").select("id, company_name, slug, logo_url, verified").eq("id", project.owner_id).maybeSingle(),
    ]);

    const hydratedProject = await hydrateProject(c, project);
    const hydratedImages = await Promise.all(
      (images ?? []).map(async (img) => ({
        ...img,
        url: (await signPath(c, "project-gallery", img.url)) ?? img.url,
      })),
    );
    const hydratedProfile = await hydrateProfile(c, profile);

    return {
      project: hydratedProject,
      milestones: milestones ?? [],
      images: hydratedImages,
      profile: hydratedProfile,
    };
  });

export const getCompanyProfile = createServerFn({ method: "GET" })
  .inputValidator((input) => z.object({ slug: z.string().min(1).max(120) }).parse(input))
  .handler(async ({ data }) => {
    const c = publicClient();
    const { data: profile, error } = await c
      .from("profiles")
      .select("id, company_name, slug, logo_url, website, bio, verified, created_at")
      .eq("slug", data.slug)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!profile) return null;

    const { data: projects } = await c
      .from("projects")
      .select("id, slug, title, location, cover_url, price_from, price_to, currency, status, owner_id, created_at")
      .eq("owner_id", profile.id)
      .eq("status", "published")
      .order("created_at", { ascending: false });

    const hydratedProfile = await hydrateProfile(c, profile);
    const hydratedProjects = await Promise.all((projects ?? []).map((p) => hydrateProject(c, p)));
    return { profile: hydratedProfile, projects: hydratedProjects };
  });
