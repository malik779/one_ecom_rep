import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { isWithinLast24Hours, NEW_ORDER_THRESHOLD_MS } from './date.util';

describe('date.util', () => {
  const baseTime = new Date('2025-02-02T12:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('isWithinLast24Hours', () => {
    it('returns true for a date 1 hour ago', () => {
      const oneHourAgo = new Date(baseTime - 60 * 60 * 1000).toISOString();
      expect(isWithinLast24Hours(oneHourAgo)).toBe(true);
    });

    it('returns true for a date 23 hours ago', () => {
      const twentyThreeHoursAgo = new Date(baseTime - 23 * 60 * 60 * 1000).toISOString();
      expect(isWithinLast24Hours(twentyThreeHoursAgo)).toBe(true);
    });

    it('returns false for a date 25 hours ago', () => {
      const twentyFiveHoursAgo = new Date(baseTime - 25 * 60 * 60 * 1000).toISOString();
      expect(isWithinLast24Hours(twentyFiveHoursAgo)).toBe(false);
    });

    it('returns false for null or undefined', () => {
      expect(isWithinLast24Hours(null)).toBe(false);
      expect(isWithinLast24Hours(undefined)).toBe(false);
    });

    it('returns false for invalid date string', () => {
      expect(isWithinLast24Hours('not-a-date')).toBe(false);
    });
  });

  describe('NEW_ORDER_THRESHOLD_MS', () => {
    it('equals 24 hours in milliseconds', () => {
      expect(NEW_ORDER_THRESHOLD_MS).toBe(24 * 60 * 60 * 1000);
    });
  });
});
