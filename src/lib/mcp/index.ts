import { auth, defineMcp } from "@lovable.dev/mcp-js";
import searchPublishedProjects from "./tools/search-published-projects";
import getPublishedProject from "./tools/get-published-project";
import listMyProjects from "./tools/list-my-projects";
import createProject from "./tools/create-project";
import updateProject from "./tools/update-project";

// The OAuth issuer must be the direct Supabase host; the project ref is the only
// value that survives publish unchanged and Vite inlines it at build time.
const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "insider-floor-plans",
  title: "Insider Floor Plans",
  version: "0.1.0",
  instructions:
    "Tools for INSIDER, a marketplace of off-plan real-estate developments with 3D floor plans. Anyone can search and read published projects. Signed-in developer accounts can list, create and update their own listings.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [searchPublishedProjects, getPublishedProject, listMyProjects, createProject, updateProject],
});
