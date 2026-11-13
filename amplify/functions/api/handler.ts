import { PutCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, queryAll, profilesFor, listing, detail, publicProfile, SLUG_RE } from '../shared/db';

const PROJECT = () => process.env.PROJECT_TABLE!;
const PROFILE = () => process.env.PROFILE_TABLE!;
const TIERS = ['explorer', 'insider', 'concierge'];

const byNewest = (a: any, b: any) => String(b.createdAt).localeCompare(String(a.createdAt));

async function listPublished() {
  const items = (await queryAll(PROJECT(), 'byStatus', 'status', 'published')).sort(byNewest).slice(0, 60);
  const profiles = await profilesFor(PROFILE(), items.map((p) => p.ownerGroup));
  return items.map((p) => {
    const prof = profiles.get(p.ownerGroup);
    return { ...listing(p), developer: prof?.companyName ?? null, developerSlug: prof?.slug ?? null, developerVerified: !!prof?.verified };
  });
}

async function getPublished(slug: string) {
  if (!SLUG_RE.test(slug)) return null;
  const project = (await queryAll(PROJECT(), 'bySlug', 'slug', slug))
    .filter((p) => p.status === 'published')
    .sort((a, b) => String(a.createdAt).localeCompare(String(b.createdAt)))[0];
  if (!project) return null;
  const profile = (await profilesFor(PROFILE(), [project.ownerGroup])).get(project.ownerGroup);
  return { project: detail(project), profile: publicProfile(profile) };
}

async function getCompany(slug: string) {
  if (!SLUG_RE.test(slug)) return null;
  // Duplicates are resolved deterministically: the oldest profile owns the slug.
  const profile = (await queryAll(PROFILE(), 'bySlug', 'slug', slug)).sort((a, b) =>
    String(a.createdAt).localeCompare(String(b.createdAt)),
  )[0];
  if (!profile) return null;
  const projects = (await queryAll(PROJECT(), 'byOwner', 'ownerGroup', profile.ownerGroup))
    .filter((p) => p.status === 'published')
    .sort(byNewest);
  return { profile: publicProfile(profile), projects: projects.map(listing) };
}

async function slugAvailable(kind: string, slug: string, exceptId: string | undefined, sub: string) {
  if (!SLUG_RE.test(slug)) return { available: false, reason: 'Use 2-80 lowercase letters, numbers or hyphens.' };
  if (kind === 'project') {
    const hits = await queryAll(PROJECT(), 'bySlug', 'slug', slug);
    return { available: hits.every((p) => p.id === exceptId) };
  }
  const hits = await queryAll(PROFILE(), 'bySlug', 'slug', slug);
  return { available: hits.every((p) => p.ownerGroup === `dev_${sub}`) };
}

async function setTier(tier: string, identity: any) {
  // Closes the original "anyone can grant themselves a plan" hole: disabled unless explicitly in test mode.
  if (process.env.BILLING_MODE !== 'test') throw new Error('Billing is not configured for this environment.');
  if (!TIERS.includes(tier)) throw new Error('Unknown plan.');
  const now = new Date();
  const periodEnd = new Date(now.getTime() + 30 * 86400_000).toISOString();
  await ddb.send(
    new PutCommand({
      TableName: process.env.SUBSCRIPTION_TABLE!,
      Item: {
        id: identity.sub,
        owner: `${identity.sub}::${identity.username}`,
        tier,
        subscribed: true,
        periodEnd,
        __typename: 'Subscription',
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      },
    }),
  );
  return { ok: true, tier, periodEnd };
}

export const handler = async (event: any) => {
  const args = event.arguments ?? {};
  const identity = event.identity ?? {};
  let result: unknown;
  switch (event.fieldName) {
    case 'listPublishedProjects': result = await listPublished(); break;
    case 'getPublishedProject': result = await getPublished(String(args.slug)); break;
    case 'getCompanyProfile': result = await getCompany(String(args.slug)); break;
    case 'isSlugAvailable': result = await slugAvailable(String(args.kind), String(args.slug), args.exceptId, identity.sub); break;
    case 'setSubscriptionTier': result = await setTier(String(args.tier), identity); break;
    default: throw new Error(`Unknown operation ${event.fieldName}`);
  }
  return JSON.stringify(result);
};
