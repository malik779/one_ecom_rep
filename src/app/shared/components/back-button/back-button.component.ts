import { Component, Input } from '@angular/core';
import { Location } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-back-button',
  standalone: true,
  template: `
    <button
      type="button"
      class="back-button"
      (click)="goBack()"
      [attr.aria-label]="label || 'Go back'"
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <polyline points="15 18 9 12 15 6"></polyline>
      </svg>
      <span>{{ label || 'Back' }}</span>
    </button>
  `,
  styles: [`
    .back-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      margin-bottom: 24px;
      border: 1px solid var(--border);
      background: var(--surface);
      color: var(--text-primary);
      border-radius: 8px;
      cursor: pointer;
      font-size: 0.9rem;
      font-weight: 500;
      transition: all 0.2s ease;
    }

    .back-button:hover {
      background: var(--bg);
      border-color: var(--primary);
      color: var(--primary);
    }

    .back-button:active {
      transform: scale(0.98);
    }

    .back-button svg {
      display: block;
    }
  `]
})
export class BackButtonComponent {
  @Input() label?: string;
  @Input() fallbackRoute: string = '/';

  constructor(
    private readonly location: Location,
    private readonly router: Router
  ) {}

  goBack(): void {
    // Try to go back in browser history
    if (window.history.length > 1) {
      this.location.back();
    } else {
      // Fall back to home page if no history
      this.router.navigate([this.fallbackRoute]);
    }
  }
}
