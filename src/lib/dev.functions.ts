import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { httpUrlSchema, slugify } from "@/lib/utils/url";

// ============ PROFILE ============

const profileUpdateSchema = z.object({
  company_name: z.string().trim().min(1).max(120),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/),
  logo_url: z.string().nullable().optional(),
  website: z.string().trim().max(2048).optional().or(z.literal("")),
  contact_email: z.string().trim().email().max(255).optional().or(z.literal("")),
  bio: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("*")
      .eq("id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => profileUpdateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const payload = {
      ...data,
      website: data.website?.trim() || null,
      contact_email: data.contact_email?.trim() || null,
      bio: data.bio?.trim() || null,
      logo_url: data.logo_url || null,
    };
    const { error } = await context.supabase
      .from("profiles")
      .update(payload)
      .eq("id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ PROJECTS ============

const milestoneSchema = z.object({
  label: z.string().trim().min(1).max(120),
  date: z.string().min(4).max(20),
  order_index: z.number().int().nonnegative().default(0),
});

const imageSchema = z.object({
  url: z.string().min(1).max(2048),
  caption: z.string().max(200).optional().or(z.literal("")),
  order_index: z.number().int().nonnegative().default(0),
});

const projectUpsertSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  slug: z.string().trim().min(2).max(80).regex(/^[a-z0-9-]+$/).optional(),
  location: z.string().trim().max(200).default(""),
  description: z.string().trim().max(5000).default(""),
  cover_url: z.string().nullable().optional(),
  price_from: z.number().int().nullable().optional(),
  price_to: z.number().int().nullable().optional(),
  currency: z.string().length(3).default("USD"),
  units_total: z.number().int().nullable().optional(),
  units_remaining: z.number().int().nullable().optional(),
  model_url: z.string().nullable().optional(),
  walkthrough_url: httpUrlSchema.optional().or(z.literal("")),
  status: z.enum(["draft", "published", "sold_out"]).default("draft"),
  milestones: z.array(milestoneSchema).default([]),
  images: z.array(imageSchema).default([]),
});

export const listMyProjects = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("projects")
      .select("*")
      .eq("owner_id", context.userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

export const getMyProject = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: project, error } = await context.supabase
      .from("projects")
      .select("*")
      .eq("id", data.id)
      .eq("owner_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!project) return null;
    const [{ data: milestones }, { data: images }] = await Promise.all([
      context.supabase.from("project_milestones").select("*").eq("project_id", project.id).order("order_index"),
      context.supabase.from("project_images").select("*").eq("project_id", project.id).order("order_index"),
    ]);
    return { project, milestones: milestones ?? [], images: images ?? [] };
  });

export const upsertProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => projectUpsertSchema.parse(input))
  .handler(async ({ data, context }) => {
    const baseSlug = data.slug || slugify(data.title);
    const finalSlug = baseSlug || `project-${Date.now()}`;

    const projectData = {
      owner_id: context.userId,
      title: data.title,
      slug: finalSlug,
      location: data.location,
      description: data.description,
      cover_url: data.cover_url || null,
      price_from: data.price_from ?? null,
      price_to: data.price_to ?? null,
      currency: data.currency,
      units_total: data.units_total ?? null,
      units_remaining: data.units_remaining ?? null,
      model_url: data.model_url || null,
      walkthrough_url: data.walkthrough_url?.trim() || null,
      status: data.status,
    };

    let projectId: string;
    if (data.id) {
      // Verify ownership before update.
      const { data: existing } = await context.supabase
        .from("projects")
        .select("owner_id")
        .eq("id", data.id)
        .maybeSingle();
      if (!existing || existing.owner_id !== context.userId) {
        throw new Error("Forbidden: not the owner of this project");
      }
      const { error } = await context.supabase.from("projects").update(projectData).eq("id", data.id);
      if (error) throw new Error(error.message);
      projectId = data.id;
    } else {
      const { data: created, error } = await context.supabase
        .from("projects")
        .insert(projectData)
        .select("id")
        .single();
      if (error) throw new Error(error.message);
      projectId = created.id;
    }

    // Replace milestones and images (simple, correct).
    await context.supabase.from("project_milestones").delete().eq("project_id", projectId);
    if (data.milestones.length > 0) {
      const { error } = await context.supabase
        .from("project_milestones")
        .insert(data.milestones.map((m, i) => ({ ...m, project_id: projectId, order_index: i })));
      if (error) throw new Error(error.message);
    }

    await context.supabase.from("project_images").delete().eq("project_id", projectId);
    if (data.images.length > 0) {
      const { error } = await context.supabase
        .from("project_images")
        .insert(
          data.images.map((im, i) => ({
            project_id: projectId,
            url: im.url,
            caption: im.caption || null,
            order_index: i,
          })),
        );
      if (error) throw new Error(error.message);
    }

    return { ok: true, id: projectId, slug: finalSlug };
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("projects")
      .delete()
      .eq("id", data.id)
      .eq("owner_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ SUBSCRIPTION ============

const tierSchema = z.enum(["studio", "practice", "atelier"]);

// NOTE: This sets the tier locally as a stand-in for full Stripe checkout, so the
// dashboard flows can be exercised end-to-end. Real billing is wired via a separate
// checkout flow (see /billing route).
export const setSubscriptionTier = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => z.object({ tier: tierSchema }).parse(input))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("subscribers").upsert(
      {
        user_id: context.userId,
        subscribed: true,
        subscription_tier: data.tier,
        subscription_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      { onConflict: "user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const getMySubscription = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("subscribers")
      .select("*")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data;
  });
