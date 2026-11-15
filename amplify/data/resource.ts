import { a, defineData, type ClientSchema } from '@aws-amplify/backend';
import { api } from '../functions/api/resource';
import { invite } from '../functions/invite/resource';

/**
 * Authorization model
 * - Writes: `ownerGroup` holds the Cognito group "dev_<sub>". Only users in that group can touch the row.
 *   The group exists only for developers who redeemed the invite code, so buyers can never write.
 * - Public reads: served by the `api` Lambda (explicit projection, published only).
 */
const schema = a.schema({
  Profile: a
    .model({
      ownerGroup: a.string().required(),
      companyName: a.string().required(),
      slug: a.string(),
      logoPath: a.string(),
      website: a.string(),
      contactEmail: a.string(),
      bio: a.string(),
      verified: a.boolean().default(false).authorization((allow) => [allow.group('admins')]),
    })
    .identifier(['ownerGroup'])
    .secondaryIndexes((i) => [i('slug').name('bySlug')])
    .authorization((allow) => [allow.groupDefinedIn('ownerGroup')]),

  Project: a
    .model({
      ownerGroup: a.string().required(),
      slug: a.string().required(),
      title: a.string().required(),
      location: a.string().default(''),
      description: a.string().default(''),
      coverPath: a.string(),
      priceFrom: a.float(),
      priceTo: a.float(),
      currency: a.string().default('USD'),
      unitsTotal: a.integer(),
      unitsRemaining: a.integer(),
      modelPath: a.string(),
      walkthroughUrl: a.string(),
      status: a.string().default('draft'), // draft | published | sold_out
      milestones: a.json(), // [{label, date}]
      gallery: a.json(), // [{path, caption}]
    })
    .secondaryIndexes((i) => [
      i('status').name('byStatus'),
      i('slug').name('bySlug'),
      i('ownerGroup').name('byOwner'),
    ])
    .authorization((allow) => [allow.groupDefinedIn('ownerGroup')]),

  // Written only by the api Lambda. Owner may read.
  UserSubscription: a
    .model({
      tier: a.string().required(), // explorer | insider | concierge
      subscribed: a.boolean().default(false),
      periodEnd: a.datetime(),
      stripeCustomerId: a.string(),
    })
    .authorization((allow) => [allow.owner().to(['read'])]),

  listPublishedProjects: a
    .query()
    .returns(a.json())
    .authorization((allow) => [allow.guest(), allow.authenticated()])
    .handler(a.handler.function(api)),

  getPublishedProject: a
    .query()
    .arguments({ slug: a.string().required() })
    .returns(a.json())
    .authorization((allow) => [allow.guest(), allow.authenticated()])
    .handler(a.handler.function(api)),

  getCompanyProfile: a
    .query()
    .arguments({ slug: a.string().required() })
    .returns(a.json())
    .authorization((allow) => [allow.guest(), allow.authenticated()])
    .handler(a.handler.function(api)),

  isSlugAvailable: a
    .query()
    .arguments({ kind: a.string().required(), slug: a.string().required(), exceptId: a.string() })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(api)),

  setSubscriptionTier: a
    .mutation()
    .arguments({ tier: a.string().required() })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(api)),

  redeemDeveloperInvite: a
    .mutation()
    .arguments({ code: a.string().required() })
    .returns(a.json())
    .authorization((allow) => [allow.authenticated()])
    .handler(a.handler.function(invite)),
});

export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: { defaultAuthorizationMode: 'userPool' },
});
