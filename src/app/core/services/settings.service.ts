import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api';
import { AdminAppSettings, PublicAppSettings } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly api = inject(ApiService);

  getPublicSettings(): Promise<PublicAppSettings | null> {
    return this.api.getPublicSettings();
  }

  getAdminSettings(): Promise<AdminAppSettings | null> {
    return this.api.getAdminSettings();
  }

  updateSettings(settings: Partial<AdminAppSettings> & { payment_secret_key?: string; smtp_pass?: string }) {
    return this.api.updateAdminSettings(settings);
  }
}
