const compact = (n: number) => {
  const trim = (x: number) => x.toFixed(2).replace(/\.?0+$/, '');
  if (n >= 1_000_000) return `${trim(n / 1_000_000)}M`;
  if (n >= 1_000) return `${trim(n / 1_000)}K`;
  return n.toLocaleString();
};

export function formatMoneyRange(from: number | null | undefined, to: number | null | undefined, currency = 'USD') {
  const symbol = ({ USD: '$', EUR: '€', GBP: '£' } as Record<string, string>)[currency] ?? `${currency} `;
  if (from == null && to == null) return 'Contact for pricing';
  if (from != null && to != null && from !== to) return `${symbol}${compact(from)} — ${symbol}${compact(to)}`;
  return `From ${symbol}${compact((from ?? to) as number)}`;
}

export function formatDate(s: string) {
  const d = new Date(s);
  return isNaN(+d) ? s : d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

export const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 80);

export function httpUrlError(v: string): string | null {
  if (!v) return null;
  if (v.length > 2048) return 'URL is too long (max 2048 characters)';
  try { const u = new URL(v); return u.protocol === 'http:' || u.protocol === 'https:' ? null : 'URL must start with http:// or https://'; }
  catch { return 'Enter a valid URL'; }
}
