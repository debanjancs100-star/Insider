import { generateClient } from 'aws-amplify/data';
import { fetchAuthSession } from 'aws-amplify/auth';
import type { Schema } from '../../amplify/data/resource';

export const client = generateClient<Schema>();

/** a.json() may arrive as a string (custom ops) or already parsed (model reads). */
export function parseJson<T>(v: unknown, fallback: T): T {
  if (typeof v === 'string') {
    try { return JSON.parse(v) as T; } catch { return fallback; }
  }
  return (v ?? fallback) as T;
}

/** Throw on GraphQL errors instead of silently succeeding. */
export function must<T extends { data?: any; errors?: readonly { message: string }[] | undefined }>(res: T): T {
  if (res.errors?.length) throw new Error(res.errors.map((e) => e.message).join('; '));
  return res;
}

async function authMode(): Promise<'userPool' | 'identityPool'> {
  const s = await fetchAuthSession();
  return s.tokens ? 'userPool' : 'identityPool';
}

async function op<T>(kind: 'queries' | 'mutations', name: string, args: object = {}, forcePool = false): Promise<T> {
  const mode = forcePool ? 'userPool' : await authMode();
  const res = await (client as any)[kind][name](args, { authMode: mode });
  if (res.errors?.length) throw new Error(res.errors.map((e: any) => e.message).join('; '));
  return parseJson<T>(res.data, null as T);
}

export type Listing = {
  id: string; slug: string; title: string; location: string; coverPath: string | null;
  priceFrom: number | null; priceTo: number | null; currency: string; status: string; hasModel: boolean;
  developer: string | null; developerSlug: string | null; developerVerified: boolean;
};
export type PublicProfile = { companyName: string; slug: string | null; logoPath: string | null; website: string | null; bio: string | null; verified: boolean };
export type Milestone = { label: string; date: string };
export type GalleryItem = { path: string; caption: string };
export type ProjectDetail = Omit<Listing, 'developer' | 'developerSlug' | 'developerVerified'> & {
  description: string; modelPath: string | null; walkthroughUrl: string | null;
  unitsTotal: number | null; unitsRemaining: number | null; milestones: Milestone[]; gallery: GalleryItem[];
};

export const api = {
  listPublished: () => op<Listing[]>('queries', 'listPublishedProjects'),
  getPublished: (slug: string) => op<{ project: ProjectDetail; profile: PublicProfile | null } | null>('queries', 'getPublishedProject', { slug }),
  getCompany: (slug: string) => op<{ profile: PublicProfile; projects: Listing[] } | null>('queries', 'getCompanyProfile', { slug }),
  slugAvailable: (kind: 'project' | 'profile', slug: string, exceptId?: string) =>
    op<{ available: boolean; reason?: string }>('queries', 'isSlugAvailable', { kind, slug, exceptId }, true),
  setTier: (tier: string) => op<{ ok: boolean }>('mutations', 'setSubscriptionTier', { tier }, true),
  redeemInvite: (code: string) => op<{ ok: boolean; ownerGroup: string }>('mutations', 'redeemDeveloperInvite', { code }, true),
};
