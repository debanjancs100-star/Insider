import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseAnon } from "../supabase";

export default defineTool({
  name: "get_published_project",
  title: "Get published project",
  description:
    "Fetch full public details for one published development by slug, including pricing, description, construction milestones and the 3D walkthrough link.",
  inputSchema: { slug: z.string().trim().min(1).max(120).describe("Project slug, e.g. `harbour-house`.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ slug }) => {
    const supabase = supabaseAnon();
    const { data: project, error } = await supabase
      .from("projects")
      .select("*")
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!project) return { content: [{ type: "text", text: `No published project with slug "${slug}".` }], isError: true };

    const { data: milestones } = await supabase
      .from("project_milestones")
      .select("*")
      .eq("project_id", project.id)
      .order("order_index");

    const payload = { project, milestones: milestones ?? [] };
    return {
      content: [{ type: "text", text: JSON.stringify(payload) }],
      structuredContent: payload,
    };
  },
});
