# INSIDER — AWS Amplify Gen 2 edition

Off-plan real-estate marketplace: public listings with 3D models, invite-only developer studio, buyer plans, MCP server.
Vite + React 19 SPA on Amplify Hosting; Cognito, AppSync/DynamoDB, S3 and Lambda via Amplify Gen 2.

## Local development
```bash
npm install
npx ampx sandbox secret set DEVELOPER_INVITE_CODE   # choose an invite code
npx ampx sandbox                                    # deploys a personal backend, writes amplify_outputs.json
npm run dev                                         # in a second terminal
```
Set `BILLING_MODE=test` in the shell before `ampx sandbox` to enable the demo plan activation.

## Deploy
1. Push to Git, then in the Amplify console choose *Host web app* and select the repo (Gen 2 is auto-detected; `amplify.yml` is included).
2. Add the branch secret `DEVELOPER_INVITE_CODE` (Hosting → Secrets).
3. Add the SPA rewrite (Hosting → Rewrites and redirects):
   - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json|webp|glb)$)([^.]+$)/>`
   - Target: `/index.html`  Type: `200 (Rewrite)`
4. Leave `BILLING_MODE` unset in production (plan changes are then refused until Stripe is wired in).
5. Make someone an admin (may mark developers verified): Cognito console → user → add to group `admins`; then set `verified` on their Profile item.

## Roles
- Buyer: any confirmed user.
- Developer: redeems the invite code → added to `developers` and `dev_<sub>`. Every Profile/Project row carries `ownerGroup = dev_<sub>` and is writable only by that group.

## MCP server
Function URL is exported as `custom.mcpUrl` in `amplify_outputs.json`. JSON-RPC over HTTP POST. Public tools need no token; list/create/update need `Authorization: Bearer <Cognito access token>` of a developer.

## Known limitations
See the accompanying paper (Section 7): slug uniqueness is check-then-write, no SSR/OG tags, invite redemption not rate-limited, S3 writes limited per identity rather than per role, Cognito has no dynamic client registration for MCP OAuth.
This code was authored without network access and has not been installed or deployed; run `npm run typecheck` and `npx ampx sandbox` first.
