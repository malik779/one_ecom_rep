import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SettingsService } from '../../../core/services/settings.service';
import { ProductService } from '../../../core/services/product.service';
import { EmailTemplateService } from '../../../core/services/email-template.service';
import { Product } from '../../../core/models/product.model';
import { EmailTemplate, PaymentGateway } from '../../../core/models/settings.model';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, RouterLink],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss'
})
export class SettingsPageComponent implements OnInit {
  readonly loading = signal(true);
  readonly templates = signal<EmailTemplate[]>([]);
  readonly selectedTemplate = signal<EmailTemplate | null>(null);
  readonly product = signal<Product | null>(null);
  readonly saving = signal(false);

  readonly paymentForm: ReturnType<FormBuilder['group']>;
  readonly emailForm: ReturnType<FormBuilder['group']>;
  readonly productForm: ReturnType<FormBuilder['group']>;
  readonly templateForm: ReturnType<FormBuilder['group']>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly settingsService: SettingsService,
    private readonly productService: ProductService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {
    this.paymentForm = this.formBuilder.group({
      payment_gateway: ['stripe', Validators.required],
      payment_public_key: [''],
      payment_secret_key: [''],
      currency: ['USD', Validators.required],
      success_url: [''],
      cancel_url: ['']
    });

    this.emailForm = this.formBuilder.group({
      sender_email: ['', Validators.required],
      admin_email: ['', Validators.required]
    });

    this.productForm = this.formBuilder.group({
      name: ['', Validators.required],
      description: ['', Validators.required],
      price: [0, [Validators.required, Validators.min(1)]],
      currency: ['USD', Validators.required],
      features: ['', Validators.required]
    });

    this.templateForm = this.formBuilder.group({
      templateId: ['', Validators.required],
      subject: ['', Validators.required],
      html: ['', Validators.required]
    });
  }

  async ngOnInit(): Promise<void> {
    await this.loadSettings();
  }

  async loadSettings(): Promise<void> {
    this.loading.set(true);
    try {
      const [settings, templates] = await Promise.all([
        this.settingsService.getAdminSettings(),
        this.emailTemplateService.listTemplates()
      ]);
      if (settings) {
        this.paymentForm.patchValue({
          payment_gateway: settings.payment_gateway,
          payment_public_key: settings.payment_public_key ?? '',
          currency: settings.currency,
          success_url: settings.success_url,
          cancel_url: settings.cancel_url
        });
        this.emailForm.patchValue({
          sender_email: settings.sender_email ?? '',
          admin_email: settings.admin_email ?? ''
        });

        if (settings.product_id) {
          const product = await this.productService.loadProduct(settings.product_id);
          if (product) {
            this.product.set(product);
            this.productForm.patchValue({
              name: product.name,
              description: product.description,
              price: product.price,
              currency: product.currency,
              features: product.features.join(', ')
            });
          }
        }
      }

      this.templates.set(templates);
      if (templates.length > 0) {
        this.selectTemplate(templates[0].id);
      }
    } catch (error: any) {
      this.toastService.error('Unable to load settings', error?.message ?? '');
    } finally {
      this.loading.set(false);
    }
  }

  selectTemplate(templateId: string) {
    const template = this.templates().find((item) => item.id === templateId) ?? null;
    this.selectedTemplate.set(template);
    if (template) {
      this.templateForm.patchValue({
        templateId: template.id,
        subject: template.subject,
        html: template.html
      });
    }
  }

  async savePaymentSettings(): Promise<void> {
    this.saving.set(true);
    try {
      const value = this.paymentForm.getRawValue();
      await this.settingsService.updateSettings({
        payment_gateway: (value.payment_gateway ?? 'stripe') as PaymentGateway,
        payment_public_key: value.payment_public_key ?? '',
        payment_secret_key: value.payment_secret_key || undefined,
        currency: value.currency ?? 'USD',
        success_url: value.success_url ?? '',
        cancel_url: value.cancel_url ?? ''
      });
      this.paymentForm.patchValue({ payment_secret_key: '' });
      this.toastService.success('Payment settings saved', 'Gateway details updated.');
    } catch (error: any) {
      this.toastService.error('Update failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
    }
  }

  async saveEmailSettings(): Promise<void> {
    this.saving.set(true);
    try {
      const value = this.emailForm.getRawValue();
      await this.settingsService.updateSettings({
        sender_email: value.sender_email ?? '',
        admin_email: value.admin_email ?? ''
      });
      this.toastService.success('Email settings saved', 'Notifications updated.');
    } catch (error: any) {
      this.toastService.error('Update failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
    }
  }

  async saveProductSettings(): Promise<void> {
    if (!this.product()) {
      return;
    }
    this.saving.set(true);
    try {
      const value = this.productForm.getRawValue();
      const features = (value.features ?? '')
        .split(',')
        .map((feature: string) => feature.trim())
        .filter(Boolean);
      const updated = await this.productService.updateProduct({
        id: this.product()!.id,
        name: value.name ?? '',
        description: value.description ?? '',
        price: Number(value.price ?? 0),
        currency: value.currency ?? 'USD',
        features
      });
      this.product.set(updated);
      this.toastService.success('Product updated', 'Product settings saved.');
    } catch (error: any) {
      this.toastService.error('Update failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
    }
  }

  async uploadImage(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length || !this.product()) {
      return;
    }
    this.saving.set(true);
    try {
      const url = await this.productService.uploadProductImage(input.files[0], this.product()!.id);
      const updated = await this.productService.updateProduct({
        id: this.product()!.id,
        image_url: url
      });
      this.product.set(updated);
      this.toastService.success('Image updated', 'Product image uploaded.');
    } catch (error: any) {
      this.toastService.error('Upload failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
    }
  }

  async saveTemplate(): Promise<void> {
    const value = this.templateForm.getRawValue();
    if (!value.templateId) {
      return;
    }
    this.saving.set(true);
    try {
      const updated = await this.emailTemplateService.updateTemplate({
        id: value.templateId,
        name: this.selectedTemplate()?.name ?? '',
        subject: value.subject ?? '',
        html: value.html ?? ''
      });
      this.templates.set(
        this.templates().map((template) => (template.id === updated.id ? updated : template))
      );
      this.toastService.success('Template updated', 'Email template saved.');
    } catch (error: any) {
      this.toastService.error('Update failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
    }
  }
}
