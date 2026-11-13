import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { CognitoJwtVerifier } from 'aws-jwt-verify';
import { UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, queryAll, listing, detail, parseJson, SLUG_RE } from '../shared/db';

const PROJECT = () => process.env.PROJECT_TABLE!;
const verifier = () =>
  CognitoJwtVerifier.create({
    userPoolId: process.env.USER_POOL_ID!,
    tokenUse: 'access',
    clientId: process.env.USER_POOL_CLIENT_ID!,
  });

const status = z.enum(['draft', 'published', 'sold_out']);
const money = z.number().nonnegative().nullable();
const fields = {
  title: z.string().trim().min(1).max(160),
  location: z.string().trim().max(160),
  description: z.string().trim().max(4000),
  priceFrom: money, priceTo: money,
  currency: z.string().trim().length(3),
  unitsTotal: z.number().int().nonnegative().nullable(),
  unitsRemaining: z.number().int().nonnegative().nullable(),
  walkthroughUrl: z.string().url().max(2000).refine((u) => /^https?:/i.test(u)).nullable(),
  status,
};
const slugify = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

type Ctx = { sub: string | null; groups: string[] };
const ownerGroup = (c: Ctx) => {
  if (!c.sub || !c.groups.includes(`dev_${c.sub}`)) throw new Error('A developer account is required.');
  return `dev_${c.sub}`;
};

const tools: Record<string, { description: string; schema: any; props: object; run: (a: any, c: Ctx) => Promise<unknown> }> = {
  search_published_projects: {
    description: 'Search published off-plan developments by title or location.',
    schema: z.object({ query: z.string().trim().max(120).optional(), limit: z.number().int().min(1).max(50).default(20) }),
    props: { query: { type: 'string' }, limit: { type: 'integer', minimum: 1, maximum: 50 } },
    run: async ({ query, limit }) => {
      const q = (query ?? '').toLowerCase();
      const items = (await queryAll(PROJECT(), 'byStatus', 'status', 'published'))
        .filter((p) => !q || `${p.title} ${p.location}`.toLowerCase().includes(q)) // in-memory: no filter-grammar injection
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
        .slice(0, limit);
      return { projects: items.map(listing) };
    },
  },
  get_published_project: {
    description: 'Full public details for one published project by slug.',
    schema: z.object({ slug: z.string().trim().min(1).max(120) }),
    props: { slug: { type: 'string' } },
    run: async ({ slug }) => {
      const p = (await queryAll(PROJECT(), 'bySlug', 'slug', slug)).find((x) => x.status === 'published');
      if (!p) throw new Error(`No published project with slug "${slug}".`);
      return { project: detail(p) };
    },
  },
  list_my_projects: {
    description: 'List projects owned by the signed-in developer, including drafts.',
    schema: z.object({ status: status.optional() }),
    props: { status: { type: 'string', enum: ['draft', 'published', 'sold_out'] } },
    run: async ({ status: st }, c) => {
      const items = (await queryAll(PROJECT(), 'byOwner', 'ownerGroup', ownerGroup(c))).filter((p) => !st || p.status === st);
      return { projects: items.map((p) => ({ ...listing(p), walkthroughUrl: p.walkthroughUrl ?? null })) };
    },
  },
  create_project: {
    description: 'Create a listing (draft by default).',
    schema: z.object({ ...fields, location: fields.location.default(''), description: fields.description.default(''), currency: fields.currency.default('USD'), slug: z.string().optional(), publish: z.boolean().default(false) }).partial({ priceFrom: true, priceTo: true, unitsTotal: true, unitsRemaining: true, walkthroughUrl: true, status: true }),
    props: { title: { type: 'string' }, location: { type: 'string' }, description: { type: 'string' }, slug: { type: 'string' }, priceFrom: { type: 'number' }, priceTo: { type: 'number' }, currency: { type: 'string' }, unitsTotal: { type: 'integer' }, unitsRemaining: { type: 'integer' }, publish: { type: 'boolean' } },
    run: async (a, c) => {
      const group = ownerGroup(c);
      const slug = slugify(a.slug || a.title);
      if (!SLUG_RE.test(slug)) throw new Error('Could not derive a valid slug.');
      if ((await queryAll(PROJECT(), 'bySlug', 'slug', slug)).length) throw new Error('Slug is already taken.');
      const now = new Date().toISOString();
      const item = {
        id: randomUUID(), __typename: 'Project', createdAt: now, updatedAt: now, ownerGroup: group, slug,
        title: a.title, location: a.location, description: a.description, currency: a.currency,
        priceFrom: a.priceFrom ?? null, priceTo: a.priceTo ?? null, unitsTotal: a.unitsTotal ?? null, unitsRemaining: a.unitsRemaining ?? null,
        status: a.publish ? 'published' : 'draft', milestones: '[]', gallery: '[]',
      };
      await ddb.send(new PutCommand({ TableName: PROJECT(), Item: item, ConditionExpression: 'attribute_not_exists(id)' }));
      return { project: listing(item) };
    },
  },
  update_project: {
    description: 'Update fields of a project you own. Only supplied fields change.',
    schema: z.object({ id: z.string().uuid() }).extend(fields).partial().required({ id: true }),
    props: { id: { type: 'string' }, title: { type: 'string' }, location: { type: 'string' }, description: { type: 'string' }, priceFrom: { type: 'number' }, priceTo: { type: 'number' }, currency: { type: 'string' }, unitsTotal: { type: 'integer' }, unitsRemaining: { type: 'integer' }, walkthroughUrl: { type: 'string' }, status: { type: 'string', enum: ['draft', 'published', 'sold_out'] } },
    run: async ({ id, ...patch }, c) => {
      const group = ownerGroup(c);
      const entries = Object.entries(patch).filter(([, v]) => v !== undefined);
      if (!entries.length) throw new Error('No fields supplied to update.');
      entries.push(['updatedAt', new Date().toISOString()]);
      const r = await ddb.send(new UpdateCommand({
        TableName: PROJECT(), Key: { id },
        UpdateExpression: 'SET ' + entries.map((_, i) => `#f${i} = :v${i}`).join(', '),
        ConditionExpression: 'ownerGroup = :g',
        ExpressionAttributeNames: Object.fromEntries(entries.map(([k], i) => [`#f${i}`, k])),
        ExpressionAttributeValues: { ':g': group, ...Object.fromEntries(entries.map(([, v], i) => [`:v${i}`, v])) },
        ReturnValues: 'ALL_NEW',
      })).catch((e) => { if (e?.name === 'ConditionalCheckFailedException') throw new Error('No project with that id is owned by you.'); throw e; });
      return { project: listing(r.Attributes) };
    },
  },
};

const rpc = (id: unknown, result: unknown) => ({ jsonrpc: '2.0', id, result });
const rpcErr = (id: unknown, code: number, message: string) => ({ jsonrpc: '2.0', id, error: { code, message } });

async function dispatch(msg: any, ctx: Ctx) {
  const { id, method, params } = msg;
  if (id === undefined) return null; // notification
  switch (method) {
    case 'initialize':
      return rpc(id, { protocolVersion: '2025-03-26', capabilities: { tools: {} }, serverInfo: { name: 'insider-floor-plans', version: '0.2.0' },
        instructions: 'INSIDER marketplace. Public search/read need no auth. list/create/update require a developer bearer token.' });
    case 'ping': return rpc(id, {});
    case 'tools/list':
      return rpc(id, { tools: Object.entries(tools).map(([name, t]) => ({ name, description: t.description, inputSchema: { type: 'object', properties: t.props } })) });
    case 'tools/call': {
      const tool = tools[params?.name];
      if (!tool) return rpcErr(id, -32602, 'Unknown tool');
      try {
        const args = tool.schema.parse(params?.arguments ?? {});
        const out = await tool.run(args, ctx);
        return rpc(id, { content: [{ type: 'text', text: JSON.stringify(out) }], structuredContent: out });
      } catch (e: any) {
        return rpc(id, { isError: true, content: [{ type: 'text', text: e?.message ?? 'Tool failed' }] });
      }
    }
    default: return rpcErr(id, -32601, 'Method not found');
  }
}

export const handler = async (event: any) => {
  const headers = { 'content-type': 'application/json' };
  if (event.requestContext?.http?.method !== 'POST') return { statusCode: 405, headers, body: '{"error":"POST only"}' };

  const ctx: Ctx = { sub: null, groups: [] };
  const bearer = (event.headers?.authorization ?? '').replace(/^Bearer\s+/i, '');
  if (bearer) {
    try {
      const p: any = await verifier().verify(bearer);
      ctx.sub = p.sub; ctx.groups = p['cognito:groups'] ?? [];
    } catch { return { statusCode: 401, headers, body: '{"error":"Invalid token"}' }; }
  }

  const raw = event.isBase64Encoded ? Buffer.from(event.body ?? '', 'base64').toString() : event.body ?? '';
  let body: any;
  try { body = JSON.parse(raw); } catch { return { statusCode: 400, headers, body: JSON.stringify(rpcErr(null, -32700, 'Parse error')) }; }
  const batch = Array.isArray(body);
  const replies = (await Promise.all((batch ? body : [body]).map((m: any) => dispatch(m, ctx)))).filter(Boolean);
  if (!replies.length) return { statusCode: 202, headers, body: '' };
  return { statusCode: 200, headers, body: JSON.stringify(batch ? replies : replies[0]) };
};
