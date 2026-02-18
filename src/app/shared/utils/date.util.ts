/**
 * Milliseconds in 24 hours. Used to consider an order "new" within this window.
 */
export const NEW_ORDER_THRESHOLD_MS = 24 * 60 * 60 * 1000;

/**
 * Returns true if the given date string is within the last 24 hours.
 */
export function isWithinLast24Hours(dateInput: string | null | undefined): boolean {
  if (!dateInput) return false;
  const date = new Date(dateInput).getTime();
  if (Number.isNaN(date)) return false;
  return Date.now() - date < NEW_ORDER_THRESHOLD_MS;
}
