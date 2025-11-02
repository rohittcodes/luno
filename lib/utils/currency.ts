/**
 * Map currency code to appropriate locale
 * Works in both client and server components
 */
export function getLocaleFromCurrency(currency: string): string {
  const currencyToLocale: Record<string, string> = {
    USD: 'en-US',
    EUR: 'en-EU', // or specific European locales
    GBP: 'en-GB',
    INR: 'en-IN',
    JPY: 'ja-JP',
    CNY: 'zh-CN',
    CAD: 'en-CA',
    AUD: 'en-AU',
    NZD: 'en-NZ',
    SGD: 'en-SG',
    HKD: 'en-HK',
    CHF: 'de-CH',
    SEK: 'sv-SE',
    NOK: 'nb-NO',
    DKK: 'da-DK',
    PLN: 'pl-PL',
    MXN: 'es-MX',
    BRL: 'pt-BR',
    ZAR: 'en-ZA',
  }
  return currencyToLocale[currency] || 'en-US'
}

/**
 * Format currency amount based on user's currency preference
 * @param amount - The amount to format
 * @param currency - Currency code (e.g., 'USD', 'INR', 'EUR')
 * @param locale - Locale string (e.g., 'en-US', 'en-IN')
 */
export function formatCurrency(
  amount: number | string,
  currency: string = 'USD',
  locale?: string
): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
  
  // Use provided locale or derive from currency
  const formatLocale = locale || getLocaleFromCurrency(currency)

  return new Intl.NumberFormat(formatLocale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numAmount)
}

/**
 * Client-side currency formatting (for client components)
 * @param amount - The amount to format
 * @param currency - Currency code
 * @param locale - Optional locale (will derive from currency if not provided)
 */
export function formatCurrencyClient(
  amount: number | string,
  currency: string = 'USD',
  locale?: string
): string {
  return formatCurrency(amount, currency, locale)
}
