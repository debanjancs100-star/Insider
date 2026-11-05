export function formatMoney(amount: number | null | undefined, currency = "USD"): string {
  if (amount == null) return "—";
  const val = Number(amount);
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(val % 1_000_000 === 0 ? 0 : 1)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(val % 1_000 === 0 ? 0 : 1)}K`;
  return val.toLocaleString();
}

export function formatMoneyRange(
  from: number | null | undefined,
  to: number | null | undefined,
  currency = "USD",
): string {
  const symbol = currency === "USD" ? "$" : currency === "EUR" ? "€" : currency === "GBP" ? "£" : `${currency} `;
  if (from == null && to == null) return "Contact for pricing";
  if (from != null && to != null && from !== to) {
    return `${symbol}${formatMoney(from)} — ${symbol}${formatMoney(to)}`;
  }
  return `From ${symbol}${formatMoney(from ?? to)}`;
}

export function formatDate(dateStr: string | Date): string {
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}
