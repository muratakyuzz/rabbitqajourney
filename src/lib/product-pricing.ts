// Shared currency + billing cycle helpers used by Product configuration
// and Deal product pickers.

export const CURRENCIES = ["USD", "EUR", "GBP", "TRY", "AED", "SAR", "JPY", "CHF"] as const;
export type CurrencyCode = (typeof CURRENCIES)[number];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  USD: "$",
  EUR: "€",
  GBP: "£",
  TRY: "₺",
  AED: "د.إ",
  SAR: "﷼",
  JPY: "¥",
  CHF: "CHF ",
};

export const BILLING_CYCLES = ["monthly", "yearly", "lifetime"] as const;
export type BillingCycle = (typeof BILLING_CYCLES)[number];

export const BILLING_CYCLE_LABELS: Record<BillingCycle, string> = {
  monthly: "Monthly",
  yearly: "Yearly",
  lifetime: "Lifetime",
};

export const BILLING_CYCLE_SUFFIX: Record<BillingCycle, string> = {
  monthly: "/mo",
  yearly: "/yr",
  lifetime: " lifetime",
};

export function getCurrencySymbol(code?: string | null): string {
  if (!code) return CURRENCY_SYMBOLS.USD;
  return CURRENCY_SYMBOLS[code] ?? `${code} `;
}

export function normalizeCurrency(code?: string | null): CurrencyCode {
  const upper = (code ?? "").toUpperCase();
  return (CURRENCIES as readonly string[]).includes(upper) ? (upper as CurrencyCode) : "USD";
}

export function normalizeBillingCycle(value?: string | null): BillingCycle {
  const lower = (value ?? "").toLowerCase();
  return (BILLING_CYCLES as readonly string[]).includes(lower) ? (lower as BillingCycle) : "monthly";
}

export function formatPrice(
  price: number,
  currency?: string | null,
  billingCycle?: string | null,
): string {
  const symbol = getCurrencySymbol(normalizeCurrency(currency));
  const cycle = normalizeBillingCycle(billingCycle);
  const value = (Number.isFinite(price) ? price : 0).toLocaleString();
  return `${symbol}${value}${BILLING_CYCLE_SUFFIX[cycle]}`;
}

export function formatAmount(price: number, currency?: string | null): string {
  const symbol = getCurrencySymbol(normalizeCurrency(currency));
  const value = (Number.isFinite(price) ? price : 0).toLocaleString();
  return `${symbol}${value}`;
}