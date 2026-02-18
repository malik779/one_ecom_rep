import { Injectable, signal } from '@angular/core';
import { environment } from '@environments/environment';
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

  async loadSettings(force = false): Promise<void> {
    // Always ensure loading state is reset before starting
    if (this.loadingSignal()) {
      // If already loading, wait for it to complete or force reload
      if (!force) {
        return;
      }
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      if (environment.useMockData) {
        this.settingsSignal.set(mockPublicSettings);
        this.loadingSignal.set(false);
        return;
      }
      const settings = await this.settingsService.getPublicSettings();
      this.settingsSignal.set(settings);
    } catch (error: any) {
      this.errorSignal.set(error?.message ?? 'Unable to load settings.');
      // Don't clear settings on error - keep existing data
    } finally {
      // Always ensure loading is set to false
      this.loadingSignal.set(false);
    }
  }

  clear(): void {
    this.settingsSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
