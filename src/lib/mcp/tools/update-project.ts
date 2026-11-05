import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "update_project",
  title: "Update project",
  description:
    "Update details or publication status of a project owned by the signed-in developer. Only the supplied fields change.",
  inputSchema: {
    id: z.string().uuid().describe("Project id to update."),
    title: z.string().trim().min(1).max(160).optional(),
    location: z.string().trim().max(160).optional(),
    description: z.string().trim().max(4000).optional(),
    price_from: z.number().int().nonnegative().nullable().optional(),
    price_to: z.number().int().nonnegative().nullable().optional(),
    currency: z.string().trim().length(3).optional(),
    units_total: z.number().int().nonnegative().nullable().optional(),
    units_remaining: z.number().int().nonnegative().nullable().optional(),
    walkthrough_url: z.string().url().max(2000).nullable().optional().describe("Unreal Engine walkthrough link."),
    status: z.enum(["draft", "published", "sold_out"]).optional(),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
  handler: async ({ id, ...fields }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const patch = Object.fromEntries(Object.entries(fields).filter(([, v]) => v !== undefined));
    if (Object.keys(patch).length === 0) {
      return { content: [{ type: "text", text: "No fields supplied to update." }], isError: true };
    }

    const supabase = supabaseForUser(ctx);
    const { data, error } = await supabase
      .from("projects")
      .update(patch)
      .eq("id", id)
      .eq("owner_id", ctx.getUserId())
      .select()
      .maybeSingle();

    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) {
      return { content: [{ type: "text", text: "No project with that id is owned by you." }], isError: true };
    }
    return { content: [{ type: "text", text: JSON.stringify(data) }], structuredContent: { project: data } };
  },
});
