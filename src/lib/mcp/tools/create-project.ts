import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export default defineTool({
  name: "create_project",
  title: "Create project",
  description:
    "Create a new development listing owned by the signed-in developer. Created as a draft unless published is set.",
  inputSchema: {
    title: z.string().trim().min(1).max(160).describe("Project name."),
    location: z.string().trim().max(160).default("").describe("City / area."),
    description: z.string().trim().max(4000).default("").describe("Marketing description."),
    slug: z.string().trim().max(80).optional().describe("URL slug; derived from the title when omitted."),
    price_from: z.number().int().nonnegative().optional().describe("Lowest unit price, whole currency units."),
    price_to: z.number().int().nonnegative().optional().describe("Highest unit price, whole currency units."),
    currency: z.string().trim().length(3).default("USD").describe("ISO currency code."),
    units_total: z.number().int().nonnegative().optional(),
    units_remaining: z.number().int().nonnegative().optional(),
    publish: z.boolean().default(false).describe("Publish immediately instead of saving as a draft."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async (input, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const slug = slugify(input.slug || input.title);
    if (!slug) return { content: [{ type: "text", text: "Could not derive a valid slug." }], isError: true };

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("projects")
      .insert({
        owner_id: ctx.getUserId(),
        slug,
        title: input.title,
        location: input.location ?? "",
        description: input.description ?? "",
        price_from: input.price_from ?? null,
        price_to: input.price_to ?? null,
        currency: input.currency ?? "USD",
        units_total: input.units_total ?? null,
        units_remaining: input.units_remaining ?? null,
        status: input.publish ? "published" : "draft",
      })
      .select()
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data) }],
      structuredContent: { project: data },
    };
  },
});
