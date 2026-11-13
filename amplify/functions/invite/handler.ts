import { createHash, timingSafeEqual } from 'node:crypto';
import {
  AdminAddUserToGroupCommand,
  CognitoIdentityProviderClient,
  CreateGroupCommand,
} from '@aws-sdk/client-cognito-identity-provider';

const cognito = new CognitoIdentityProviderClient({});
const digest = (s: string) => createHash('sha256').update(s, 'utf8').digest();

/**
 * Authenticated users redeem the shared invite code. On success they join:
 *  - `developers` (shared role marker, used by storage/UI)
 *  - `dev_<sub>`  (per-owner group referenced by every Profile/Project row)
 */
export const handler = async (event: any) => {
  const { sub, username } = event.identity ?? {};
  if (!sub || !username) throw new Error('Not authenticated.');
  const expected = process.env.DEVELOPER_INVITE_CODE;
  const supplied = String(event.arguments?.code ?? '').trim();
  if (!expected || !supplied || !timingSafeEqual(digest(supplied), digest(expected.trim()))) {
    throw new Error('Invite code is not valid.');
  }

  const UserPoolId = process.env.USER_POOL_ID!;
  const ownerGroup = `dev_${sub}`;
  try {
    await cognito.send(new CreateGroupCommand({ UserPoolId, GroupName: ownerGroup, Description: 'Developer owner group' }));
  } catch (e: any) {
    if (e?.name !== 'GroupExistsException') throw e;
  }
  for (const GroupName of [ownerGroup, 'developers']) {
    await cognito.send(new AdminAddUserToGroupCommand({ UserPoolId, Username: username, GroupName }));
  }
  return JSON.stringify({ ok: true, ownerGroup });
};
