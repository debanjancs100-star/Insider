import { defineStorage } from '@aws-amplify/backend';

// Public read (listings are public); writes isolated to the uploader's Cognito identity prefix.
// Group permissions ensure developer accounts have IAM permissions to upload media & 3D models.
export const storage = defineStorage({
  name: 'insiderMedia',
  access: (allow) => ({
    'media/{entity_id}/*': [
      allow.guest.to(['read']),
      allow.authenticated.to(['read']),
      allow.entity('identity').to(['read', 'write', 'delete']),
      allow.groups(['developers', 'admins']).to(['read', 'write', 'delete']),
    ],
  }),
});
