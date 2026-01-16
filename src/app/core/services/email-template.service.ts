import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api';
import { EmailTemplate } from '../models/settings.model';

@Injectable({ providedIn: 'root' })
export class EmailTemplateService {
  private readonly api = inject(ApiService);

  listTemplates(): Promise<EmailTemplate[]> {
    return this.api.listEmailTemplates();
  }

  updateTemplate(template: EmailTemplate) {
    return this.api.updateEmailTemplate(template);
  }
}
