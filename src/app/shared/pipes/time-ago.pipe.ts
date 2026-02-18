import { Pipe, PipeTransform } from '@angular/core';

/**
 * Transforms a date string or Date into a human-readable relative time (e.g. "2 hours ago").
 * Used for tooltips and labels where relative time is more useful than an absolute date.
 */
@Pipe({
  name: 'timeAgo',
  standalone: true,
  pure: true
})
export class TimeAgoPipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (value == null) return '';
    const date = typeof value === 'string' ? new Date(value) : value;
    const ms = date.getTime();
    if (Number.isNaN(ms)) return '';

    const now = Date.now();
    const diffMs = now - ms;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    return date.toLocaleDateString();
  }
}
