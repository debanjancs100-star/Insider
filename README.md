# INSIDER

A marketplace where construction and real estate developers publish upcoming
projects — pricing, construction milestones, and interactive 3D floor-plan
models — for buyers to explore.

Built with TanStack Start (React 19), Tailwind CSS v4, and Lovable Cloud
(Supabase) for database, auth, and file storage.

## Features

- Public marketplace of published developments with search and detail pages
- Interactive 3D viewer (`@google/model-viewer`) for uploaded `.glb`/`.gltf` models
- Developer dashboard: create and edit listings, upload covers and 3D models
  (up to 250 MB), manage milestones and gallery images
- Invite-gated developer accounts (secret code required at signup)
- Buyer subscription plans (Studio / Practice / Atelier) via Stripe
- MCP server at `/mcp` (OAuth-protected) exposing project tools to AI agents

## Getting started

```bash
bun install
cp .env.example .env   # fill in your project values
bun dev
```

## Database

Schema and policies live in `supabase/migrations/`. Apply them against your
project before running the app.

## Notes

- `.env` is intentionally excluded; keep it that way and never commit secrets.
- `src/routeTree.gen.ts` is generated automatically by the router plugin.
