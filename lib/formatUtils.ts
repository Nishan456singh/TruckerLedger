/**
 * Format number as USD currency
 * @param value Amount in USD
 * @param decimals Number of decimal places (default: 0 for integer, 2 for cents)
 */
export function formatCurrency(value: number, decimals: number = 0): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

/**
 * Parse string input as currency amount
 * @param value String like "$100.50" or "100.50"
 */
export function parseAmount(value: string): number {
  if (!value.trim()) return 0;
  const parsed = Number(value.replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

/**
 * Get today's date in ISO format (YYYY-MM-DD)
 */
export function todayISO(): string {
  return new Date().toISOString().split('T')[0];
}
