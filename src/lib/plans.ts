export const PLANS = [
  { tier: 'explorer', name: 'Explorer', price: 0, tagline: 'Browse the marketplace', features: ['Public listings', '3D floor plans', 'Verified pricing', 'Save favorites'] },
  { tier: 'insider', name: 'Insider', price: 49, tagline: 'For serious buyers', featured: true, features: ['Everything in Explorer', 'Priority reservation windows', 'Direct-to-developer messaging', 'Full walkthrough access'] },
  { tier: 'concierge', name: 'Concierge', price: 249, tagline: 'For portfolio buyers', features: ['Everything in Insider', 'Personal INSIDER advisor', 'Off-market opportunities', 'Dedicated support'] },
] as const;
