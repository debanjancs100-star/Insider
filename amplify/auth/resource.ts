import { defineAuth } from '@aws-amplify/backend';

// Email sign-in. `developers` = any redeemed developer, `admins` = may set `verified`.
// Per-developer groups (dev_<sub>) are created at runtime by the invite function.
export const auth = defineAuth({
  loginWith: { email: true },
  groups: ['developers', 'admins'],
});
