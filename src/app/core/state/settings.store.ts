import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { PublicAppSettings } from '../models/settings.model';
import { SettingsService } from '../services/settings.service';
import { mockPublicSettings } from './mock-data';

@Injectable({ providedIn: 'root' })
export class SettingsStore {
  private readonly settingsSignal = signal<PublicAppSettings | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly settings = this.settingsSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private readonly settingsService: SettingsService) {}

  async loadSettings(): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      if (environment.useMockData) {
        this.settingsSignal.set(mockPublicSettings);
        return;
      }
      const settings = await this.settingsService.getPublicSettings();
      this.settingsSignal.set(settings);
    } catch (error: any) {
      this.errorSignal.set(error?.message ?? 'Unable to load settings.');
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
