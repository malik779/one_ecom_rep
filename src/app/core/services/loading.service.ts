import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LoadingService {
  private readonly loadingSignal = signal(false);
  private readonly messageSignal = signal<string | null>(null);

  readonly loading = this.loadingSignal.asReadonly();
  readonly message = this.messageSignal.asReadonly();

  show(message?: string): void {
    this.messageSignal.set(message ?? null);
    this.loadingSignal.set(true);
  }

  hide(): void {
    this.loadingSignal.set(false);
    this.messageSignal.set(null);
  }
}
