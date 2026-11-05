import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "list_my_projects",
  title: "List my projects",
  description: "List every project owned by the signed-in developer account, including drafts.",
  inputSchema: {
    status: z.enum(["draft", "published", "sold_out"]).optional().describe("Optional status filter."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ status }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    }
    const supabase = supabaseForUser(ctx);
    let request = supabase
      .from("projects")
      .select("id, slug, title, location, status, price_from, price_to, currency, model_url, walkthrough_url, created_at")
      .eq("owner_id", ctx.getUserId())
      .order("created_at", { ascending: false });
    if (status) request = request.eq("status", status);

    const { data, error } = await request;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { projects: data ?? [] },
    };
  },
});
