import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand, BatchGetCommand } from '@aws-sdk/lib-dynamodb';

export const ddb = DynamoDBDocumentClient.from(new DynamoDBClient({}), {
  marshallOptions: { removeUndefinedValues: true },
});

export const SLUG_RE = /^[a-z0-9-]{2,80}$/;

/** a.json() values are stored as JSON strings; tolerate already-parsed values. */
export function parseJson<T>(v: unknown, fallback: T): T {
  if (typeof v === 'string') {
    try { return JSON.parse(v) as T; } catch { return fallback; }
  }
  return (v ?? fallback) as T;
}

export async function queryAll(table: string, index: string, attr: string, value: string) {
  const items: Record<string, any>[] = [];
  let key: Record<string, any> | undefined;
  do {
    const r = await ddb.send(
      new QueryCommand({
        TableName: table,
        IndexName: index,
        KeyConditionExpression: '#k = :v',
        ExpressionAttributeNames: { '#k': attr },
        ExpressionAttributeValues: { ':v': value },
        ExclusiveStartKey: key,
      }),
    );
    items.push(...(r.Items ?? []));
    key = r.LastEvaluatedKey;
  } while (key);
  return items;
}

export async function profilesFor(table: string, groups: string[]) {
  const unique = [...new Set(groups)].slice(0, 100);
  const out = new Map<string, any>();
  if (!unique.length) return out;
  const r = await ddb.send(
    new BatchGetCommand({ RequestItems: { [table]: { Keys: unique.map((ownerGroup) => ({ ownerGroup })) } } }),
  );
  for (const p of r.Responses?.[table] ?? []) out.set(p.ownerGroup, p);
  return out;
}

// ---- explicit public projections: nothing else ever leaves the Lambda ----
export const listing = (p: any) => ({
  id: p.id,
  slug: p.slug,
  title: p.title,
  location: p.location ?? '',
  coverPath: p.coverPath ?? null,
  priceFrom: p.priceFrom ?? null,
  priceTo: p.priceTo ?? null,
  currency: p.currency ?? 'USD',
  status: p.status,
  hasModel: !!p.modelPath,
  createdAt: p.createdAt,
});

export const detail = (p: any) => ({
  ...listing(p),
  description: p.description ?? '',
  modelPath: p.modelPath ?? null,
  walkthroughUrl: p.walkthroughUrl ?? null,
  unitsTotal: p.unitsTotal ?? null,
  unitsRemaining: p.unitsRemaining ?? null,
  milestones: parseJson<any[]>(p.milestones, []),
  gallery: parseJson<any[]>(p.gallery, []),
});

export const publicProfile = (p: any) =>
  p
    ? {
        companyName: p.companyName,
        slug: p.slug ?? null,
        logoPath: p.logoPath ?? null,
        website: p.website ?? null,
        bio: p.bio ?? null,
        verified: !!p.verified,
      }
    : null;
