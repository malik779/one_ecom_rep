import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { TimeAgoPipe } from './time-ago.pipe';

describe('TimeAgoPipe', () => {
  const pipe = new TimeAgoPipe();
  const baseTime = new Date('2025-02-02T12:00:00Z').getTime();

  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(baseTime);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns empty string for null or undefined', () => {
    expect(pipe.transform(null)).toBe('');
    expect(pipe.transform(undefined)).toBe('');
  });

  it('returns "just now" for a date within the last minute', () => {
    const thirtySecondsAgo = new Date(baseTime - 30 * 1000).toISOString();
    expect(pipe.transform(thirtySecondsAgo)).toBe('just now');
  });

  it('returns "X minutes ago" for a date within the last hour', () => {
    const fiveMinutesAgo = new Date(baseTime - 5 * 60 * 1000).toISOString();
    expect(pipe.transform(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('returns "1 minute ago" for singular', () => {
    const oneMinuteAgo = new Date(baseTime - 1 * 60 * 1000).toISOString();
    expect(pipe.transform(oneMinuteAgo)).toBe('1 minute ago');
  });

  it('returns "X hours ago" for a date within the last 24 hours', () => {
    const twoHoursAgo = new Date(baseTime - 2 * 60 * 60 * 1000).toISOString();
    expect(pipe.transform(twoHoursAgo)).toBe('2 hours ago');
  });

  it('returns "1 hour ago" for singular', () => {
    const oneHourAgo = new Date(baseTime - 1 * 60 * 60 * 1000).toISOString();
    expect(pipe.transform(oneHourAgo)).toBe('1 hour ago');
  });

  it('returns "X days ago" for a date within the last week', () => {
    const threeDaysAgo = new Date(baseTime - 3 * 24 * 60 * 60 * 1000).toISOString();
    expect(pipe.transform(threeDaysAgo)).toBe('3 days ago');
  });

  it('returns locale date string for dates older than a week', () => {
    const tenDaysAgo = new Date(baseTime - 10 * 24 * 60 * 60 * 1000);
    const result = pipe.transform(tenDaysAgo.toISOString());
    expect(result).toBe(tenDaysAgo.toLocaleDateString());
  });

  it('returns empty string for invalid date string', () => {
    expect(pipe.transform('invalid')).toBe('');
  });
});
