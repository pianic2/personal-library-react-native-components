// Intl formatters with a plain fallback: Hermes builds without Intl, old WebViews and invalid locales must not crash a screen.

type IntlLike = {
  NumberFormat?: new (locale?: string, options?: Record<string, unknown>) => { format(value: number): string };
  DateTimeFormat?: new (locale?: string, options?: Record<string, unknown>) => { format(value: Date | number): string; resolvedOptions(): { locale: string } };
};

const intl = (): IntlLike | undefined => (globalThis as { Intl?: IntlLike }).Intl;

/** `Intl.NumberFormat` result, or `String(value)` when Intl is missing or rejects the locale/options. */
export function formatNumber(value: number, locale?: string, options?: Record<string, unknown>): string {
  try {
    const Format = intl()?.NumberFormat;
    if (Format) return new Format(locale, options).format(value);
  } catch {
    // fall back below
  }
  return String(value);
}

/** `Intl.DateTimeFormat` result, or an ISO date (`YYYY-MM-DD`, UTC) when Intl is missing or rejects the locale/options. */
export function formatDate(value: Date | number, locale?: string, options?: Record<string, unknown>): string {
  try {
    const Format = intl()?.DateTimeFormat;
    if (Format) return new Format(locale, options).format(value);
  } catch {
    // fall back below
  }
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
}

let cachedLocale: string | undefined;

/** The runtime's default locale (BCP 47), or `"en"` when it cannot be read. Resolved once: building an Intl object is slow on Hermes. */
export function defaultLocale(): string {
  if (cachedLocale) return cachedLocale;
  try {
    const Format = intl()?.DateTimeFormat;
    if (Format) return (cachedLocale = new Format().resolvedOptions().locale || "en");
  } catch {
    // fall back below
  }
  return "en";
}
