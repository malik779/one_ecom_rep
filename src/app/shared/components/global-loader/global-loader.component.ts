import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { LoadingService } from '../../../core/services/loading.service';

@Component({
  selector: 'app-global-loader',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="global-loader-overlay" *ngIf="loadingService.loading()">
      <div class="global-loader-content">
        <div class="spinner"></div>
        <p *ngIf="loadingService.message()" class="loader-message">
          {{ loadingService.message() }}
        </p>
      </div>
    </div>
  `,
  styles: [
    `
      .global-loader-overlay {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(15, 23, 42, 0.8);
        backdrop-filter: blur(4px);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 9999;
        animation: fadeIn 0.2s ease;
      }

      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }

      .global-loader-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
      }

      .spinner {
        width: 48px;
        height: 48px;
        border: 4px solid rgba(255, 255, 255, 0.2);
        border-top-color: var(--primary, #5b7cfa);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
      }

      @keyframes spin {
        to {
          transform: rotate(360deg);
        }
      }

      .loader-message {
        color: white;
        font-size: 1rem;
        font-weight: 500;
        margin: 0;
        text-align: center;
      }
    `
  ]
})
export class GlobalLoaderComponent {
  constructor(readonly loadingService: LoadingService) {}
}
