import { client, must } from './amplify';

/** Create the developer's company profile row if it doesn't exist yet. */
export async function ensureProfile(ownerGroup: string, companyName: string, contactEmail?: string) {
  const existing = must(await client.models.Profile.get({ ownerGroup })).data;
  if (existing) return existing;
  const created = must(await client.models.Profile.create({ ownerGroup, companyName: companyName || 'My company', contactEmail })).data;
  return created!;
}
