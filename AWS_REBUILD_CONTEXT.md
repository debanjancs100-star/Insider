# INSIDER — AWS Cloud Architecture & Rebuild Context

This document captures the complete architectural state of the **INSIDER** platform, analyzing the current implementation, reviewing the existing AWS Amplify prototype in `claude built/`, and establishing the architectural choices and questions required to rebuild the project for AWS from the ground up.

---

## 1. Project Overview

**INSIDER** is an off-plan real-estate and architectural marketplace connecting construction developers and prospective buyers.

### Key Capabilities
- **Public Marketplace**: Searchable catalog of pre-construction and architectural developments, detailed project pages, pricing, milestone tracking, and unit availability.
- **Interactive 3D Floor Plans**: In-browser 3D model rendering via `@google/model-viewer` for `.glb`/`.gltf` files (supporting files up to 250 MB).
- **Developer Studio / Dashboard**: Invite-gated developer portal for listing creation, multi-image gallery uploads, milestone timeline management, and company profile customization.
- **Buyer Membership & Subscriptions**: Tiered membership plans (Explorer / Insider / Concierge) for buyers.
- **AI Agent Integration (MCP)**: Native Model Context Protocol (MCP) server exposed at `/mcp` with OAuth/Bearer authorization, allowing AI agents to query and manage listings.

---

## 2. Current Architecture (As-Is / Baseline)

| Component | Technology | Details / Implementation |
|---|---|---|
| **Frontend Framework** | React 19 (`react` & `react-dom` 19.2) | Styled with Tailwind CSS v4, Radix UI primitives, Lucide icons, Sonner notifications |
| **Routing & SSR** | TanStack Start (v1.168+) + TanStack Router | File-based routing (`src/routes`), SSR rendering, `createServerFn` server RPCs, Nitro engine |
| **State & Data Fetching** | TanStack React Query v5 | Client-side caching and mutation handling |
| **Database** | PostgreSQL (via Supabase / Lovable Cloud) | Relational schema with UUID keys, foreign key constraints, triggers, indexes, and Row Level Security (RLS) |
| **Authentication** | Supabase Auth | Email/password auth, session cookies, JWT token verification, custom `user_roles` (`developer` vs `company`) |
| **Developer Onboarding** | Invite Code Verification | Server function hashes input with SHA-256 and validates with timing-safe equality against `DEVELOPER_INVITE_CODE` |
| **File Storage** | Supabase Storage (S3-compatible) | Buckets: `company-logos`, `project-covers`, `project-models`, `project-gallery` |
| **MCP AI Server** | `@lovable.dev/mcp-js` | Exposes project search and developer CRUD tools over JSON-RPC at `/mcp` |

### Database Entities & Relations
1. **`profiles`**: Linked 1:1 to `auth.users`. Company name, unique slug, logo URL, website, contact email, bio, verification status.
2. **`projects`**: Project listings owned by developers. Unique slug, title, location, description, cover image, price range, units total/remaining, 3D model URL, status (`draft`, `published`, `sold_out`).
3. **`project_milestones`**: Construction schedule entries (label, date, order index) tied to `projects.id` with cascade deletion.
4. **`project_images`**: Media gallery items (URL, caption, order index) tied to `projects.id` with cascade deletion.
5. **`subscribers`**: Buyer membership tier tracking (`studio`, `practice`, `atelier`), subscription status, expiration timestamps.
6. **`user_roles`**: Maps user UUIDs to roles (`developer`, `company`).

---

## 3. Analysis of Existing Prototype (`claude built/insider-amplify.zip`)

An initial rebuild prototype targeting **AWS Amplify Gen 2** was created in `claude built/insider-amplify.zip`. 

### What That Prototype Implemented:
- **Framework Shift**: Converted TanStack Start SSR into a pure **Vite + React Router v6 SPA**.
- **Auth**: Replaced Supabase Auth with **Amazon Cognito User Pools**, managing developer roles via Cognito groups (`developers` and per-developer `dev_<sub>` groups).
- **Data Layer**: Replaced PostgreSQL with **Amazon DynamoDB via AWS AppSync** (`@aws-amplify/data`).
- **Media Storage**: Configured **Amazon S3** (`@aws-amplify/storage`) for project covers, gallery images, and 3D models.
- **Serverless Compute**: Lambda functions for public API queries, invite code redemption, and an unauthenticated Function URL for `/mcp` with manual Cognito JWT verification.

### Tradeoffs & Known Limitations Identified:
1. **Loss of SSR & SEO**: Moving from TanStack Start to a pure client-side SPA impairs public search engine indexing and dynamic OpenGraph preview cards for real estate project links (`/projects/:slug`).
2. **Relational vs. NoSQL Impedance**: DynamoDB lacks native relational foreign keys and transactionally enforced unique slugs. The prototype had to resort to check-then-write logic, creating potential race conditions.
3. **Milestones & Gallery Flattening**: Normalized relational tables (`project_milestones`, `project_images`) were collapsed into JSON string attributes on the Project DynamoDB record.
4. **Cognito Dynamic Registration for MCP**: Cognito does not natively support dynamic client registration for third-party AI agent OAuth out-of-the-box.

---

## 4. AWS Target Architecture Options

Before proceeding with the code rebuild, we evaluate the 3 primary AWS architecture paths:

```
+---------------------------------------------------------------------------------------------------+
| PATH 1: Pure Serverless Amplify Gen 2 (SPA + AppSync / DynamoDB + S3 + Cognito)                   |
| - Fast serverless setup via TypeScript-defined backend.                                           |
| - Client-side SPA deployed to Amplify Hosting.                                                    |
| - NoSQL DynamoDB tables + AppSync GraphQL API + Lambda compute.                                   |
+---------------------------------------------------------------------------------------------------+
| PATH 2: Containerized Modern Full-Stack (ECS Fargate / App Runner + RDS PostgreSQL + S3 + Cognito)|
| - Preserves TanStack Start (React 19 SSR) with full SEO, server functions, and fast SSR.          |
| - Preserves 100% of PostgreSQL relational schema, migrations, foreign keys, and indexes on RDS.    |
| - Container packaged via Docker, hosted on AWS App Runner or ECS Fargate behind CloudFront.       |
| - Files (3D models, images) in S3 with presigned uploads. Auth via Cognito or Supabase/Auth0.     |
+---------------------------------------------------------------------------------------------------+
| PATH 3: Hybrid Serverless / SST (Lambda SSR + Aurora Serverless v2 PostgreSQL + S3 + CloudFront)  |
| - SSR app built for Lambda (Nitro preset: aws-lambda) behind CloudFront CDN.                      |
| - Aurora Serverless v2 PostgreSQL for true relational queries with serverless auto-scaling.        |
| - S3 for assets and models.                                                                       |
+---------------------------------------------------------------------------------------------------+
```

---

## 5. Confirmed Architectural Decisions (User Approved)

Following review and requirements clarification, the target architecture and strategy are confirmed as follows:

1. **Architecture & Hosting Platform**: **AWS Amplify Gen 2 (Serverless Full-Stack)**
   - **Frontend**: Vite + React 19 Single Page Application (SPA), styled with Tailwind CSS v4, `@google/model-viewer` for 3D GLB/GLTF models, Sonner toasts.
   - **Authentication**: Amazon Cognito User Pool (`email` login, user groups `developers` and `admins`, runtime dynamic developer groups `dev_<sub>`).
   - **API & Data Engine**: Amazon DynamoDB managed via AWS AppSync GraphQL schema (`@aws-amplify/data`).
   - **Storage**: Amazon S3 (`@aws-amplify/storage`) with public read access and identity-scoped writes for 3D models (up to 250MB), project covers, gallery photos, and company logos.
   - **Compute / Lambdas**: AWS Lambda functions for:
     - `api`: Public catalog queries, project detail, company profile, slug availability, test billing mutations.
     - `invite`: Developer invite code validation (timing-safe SHA-256) and Cognito group assignment.
     - `mcp`: JSON-RPC 2.0 Model Context Protocol endpoint exposed via public Function URL with Cognito Bearer JWT authorization.

2. **Database Engine**: **Amazon DynamoDB via AppSync**
   - High performance, serverless, zero maintenance, native Amplify Gen 2 integration.
   - Global Secondary Indexes (GSIs): `byStatus`, `bySlug`, `byOwner`.

3. **Repository & Version Control Strategy**:
   - Deployed directly to the **`main`** branch of GitHub repo `https://github.com/debanjancs100-star/Insider.git`.
   - **Strict Lovable History Preservation**: As required by `AGENTS.md`, commits are made as standard linear forward commits (no git rebase, no squash, no force-push) so that the Lovable connection remains fully intact and functional.

---

## 6. AWS Amplify Gen 2 Deployment Guide

### Prerequisites
- AWS Account with Administrator or Amplify deployment permissions.
- Node.js 20+ installed locally.
- Branch secret configured in AWS Amplify Console: `DEVELOPER_INVITE_CODE`.

### Deployment Steps (AWS Console)
1. **Connect Repository**:
   - Open AWS Amplify Console → Select **Host web app**.
   - Choose GitHub and select repository `debanjancs100-star/Insider`.
   - Select branch `main`.
2. **Gen 2 Auto-Detection**:
   - Amplify automatically detects Gen 2 (`amplify/backend.ts`).
   - Build settings are read from `amplify.yml`.
3. **Configure Environment Secret**:
   - Under **App settings** → **Environment variables** / **Secrets**, add:
     - Key: `DEVELOPER_INVITE_CODE`
     - Value: `<your-secret-developer-passphrase>`
   - (Optional) For demo subscriptions without Stripe:
     - Key: `BILLING_MODE`
     - Value: `test`
4. **Configure Single Page Application (SPA) Rewrites**:
   - Navigate to **App settings** → **Rewrites and redirects**.
   - Ensure the SPA redirect is active:
     - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|glb)$)([^.]+$)/>`
     - Target: `/index.html`
     - Type: `200 (Rewrite)`
5. **Save and Deploy**:
   - Amplify deploys the backend stack (Cognito, AppSync, DynamoDB, S3, Lambdas) and the frontend build artifacts to global CloudFront hosting.

