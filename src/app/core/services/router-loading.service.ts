import { Injectable, inject } from '@angular/core';
import { Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { filter } from 'rxjs/operators';
import { LoadingService } from './loading.service';

@Injectable({ providedIn: 'root' })
export class RouterLoadingService {
  private readonly router = inject(Router);
  private readonly loadingService = inject(LoadingService);
  private isInitialized = false;

  initialize(): void {
    if (this.isInitialized) {
      return;
    }
    this.isInitialized = true;

    this.router.events
      .pipe(
        filter(
          (event) =>
            event instanceof NavigationStart ||
            event instanceof NavigationEnd ||
            event instanceof NavigationCancel ||
            event instanceof NavigationError
        )
      )
      .subscribe((event) => {
        if (event instanceof NavigationStart) {
          // Only show loader for navigation, not for initial load
          if (event.url !== '/' && !event.url.startsWith('/?')) {
            this.loadingService.show('Loading...');
          }
        } else if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          // Small delay to ensure smooth transition
          setTimeout(() => this.loadingService.hide(), 100);
        }
      });
  }
}
