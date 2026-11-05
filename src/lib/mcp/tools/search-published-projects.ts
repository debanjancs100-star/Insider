import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

const LIST_COLUMNS =
  "id, slug, title, location, price_from, price_to, currency, status, units_total, units_remaining, created_at";

export default defineTool({
  name: "search_published_projects",
  title: "Search published projects",
  description:
    "Search the public INSIDER marketplace for published off-plan developments by title or location.",
  inputSchema: {
    query: z.string().trim().max(120).optional().describe("Text to match against title or location."),
    limit: z.number().int().min(1).max(50).default(20).describe("Maximum number of projects to return."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ query, limit }) => {
    const supabase = supabaseAnon();
    let request = supabase
      .from("projects")
      .select(LIST_COLUMNS)
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(limit ?? 20);
    if (query) request = request.or(`title.ilike.%${query}%,location.ilike.%${query}%`);

    const { data, error } = await request;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data ?? []) }],
      structuredContent: { projects: data ?? [] },
    };
  },
});
