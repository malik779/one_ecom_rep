import { Component, OnInit, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { SettingsService } from '../../../core/services/settings.service';
import { ProductService } from '../../../core/services/product.service';
import { EmailTemplateService } from '../../../core/services/email-template.service';
import { Product } from '../../../core/models/product.model';
import { EmailTemplate, PaymentGateway } from '../../../core/models/settings.model';
import { ToastService } from '../../../core/services/toast.service';
import { SettingsStore } from '../../../core/state/settings.store';
import { ApiService } from '../../../core/api/api';

@Component({
  selector: 'app-settings-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, RouterLink],
  templateUrl: './settings-page.component.html',
  styleUrl: './settings-page.component.scss'
})
export class SettingsPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly loading = signal(true);
  readonly templates = signal<EmailTemplate[]>([]);
  readonly selectedTemplate = signal<EmailTemplate | null>(null);
  readonly product = signal<Product | null>(null);
  readonly saving = signal(false);
  readonly logoFile = signal<File | null>(null);
  readonly faviconFile = signal<File | null>(null);
  readonly logoPreview = signal<string | null>(null);
  readonly faviconPreview = signal<string | null>(null);

  readonly paymentForm: ReturnType<FormBuilder['group']>;
  readonly emailForm: ReturnType<FormBuilder['group']>;
  readonly smtpForm: ReturnType<FormBuilder['group']>;
  readonly productForm: ReturnType<FormBuilder['group']>;
  readonly templateForm: ReturnType<FormBuilder['group']>;
  readonly brandingForm: ReturnType<FormBuilder['group']>;

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly settingsService: SettingsService,
    private readonly productService: ProductService,
    private readonly emailTemplateService: EmailTemplateService,
    private readonly toastService: ToastService,
    private readonly router: Router,
    private readonly route: ActivatedRoute,
    private readonly settingsStore: SettingsStore,
    private readonly api: ApiService
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
    this.smtpForm = this.formBuilder.group({
      smtp_host: ['', Validators.required],
      smtp_user: ['', Validators.required],
      smtp_port: [465, [Validators.required, Validators.min(1), Validators.max(65535)]],
      smtp_pass: [''] // Not required - leave blank to keep current password
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

    this.brandingForm = this.formBuilder.group({
      website_name: ['One Product Store', Validators.required]
    });
  }

  onLogoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.logoFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.logoPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  onFaviconSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) {
      this.faviconFile.set(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        this.faviconPreview.set(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  removeLogo(): void {
    this.logoFile.set(null);
    this.logoPreview.set(null);
  }

  removeFavicon(): void {
    this.faviconFile.set(null);
    this.faviconPreview.set(null);
  }

  async ngOnInit(): Promise<void> {
    // Load data on initial load
    await this.loadSettings();

    // Reload data when navigating to this route (handles component reuse)
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        filter(() => {
          const url = this.router.url;
          return url === '/admin/settings' || url.startsWith('/admin/settings?');
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.loadSettings();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
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

        this.smtpForm.patchValue({
          smtp_host: settings.smtp_host ?? '',
          smtp_user: settings.smtp_user ?? '',
          smtp_port: settings.smtp_port ?? 465
        });

        this.brandingForm.patchValue({
          website_name: settings.website_name ?? 'One Product Store'
        });
        
        // Set previews if URLs exist
        if (settings.logo_url) {
          this.logoPreview.set(settings.logo_url);
        }
        if (settings.favicon_url) {
          this.faviconPreview.set(settings.favicon_url);
        }

        if (settings.product_id) {
          const product = await this.productService.loadProduct(settings.product_id, true);
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
    if (this.paymentForm.invalid) {
      this.paymentForm.markAllAsTouched();
      this.toastService.error('Validation failed', 'Please check all required fields.');
      return;
    }

    if (this.saving()) {
      return; // Prevent double submission
    }

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
      
      // Clear secret key field and reset form state
      this.paymentForm.patchValue({ payment_secret_key: '' }, { emitEvent: false });
      this.paymentForm.markAsPristine();
      this.paymentForm.markAsUntouched();
      
      this.toastService.success('Payment settings saved', 'Gateway details updated.');
    } catch (error: any) {
      this.toastService.error('Update failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
    }
  }

  async saveEmailSettings(): Promise<void> {
    if (this.emailForm.invalid) {
      this.emailForm.markAllAsTouched();
      this.toastService.error('Validation failed', 'Please check all required fields.');
      return;
    }

    if (this.saving()) {
      return; // Prevent double submission
    }

    this.saving.set(true);
    try {
      const value = this.emailForm.getRawValue();
      await this.settingsService.updateSettings({
        sender_email: value.sender_email ?? '',
        admin_email: value.admin_email ?? ''
      });
      this.emailForm.markAsPristine();
      this.emailForm.markAsUntouched();
      this.toastService.success('Email settings saved', 'Notifications updated.');
    } catch (error: any) {
      this.toastService.error('Update failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
    }
  }

  async saveSmtpSettings(): Promise<void> {
    if (this.smtpForm.invalid) {
      this.smtpForm.markAllAsTouched();
      this.toastService.error('Validation failed', 'Please check all required fields.');
      return;
    }

    if (this.saving()) {
      return; // Prevent double submission
    }

    this.saving.set(true);
    try {
      const value = this.smtpForm.getRawValue();
      await this.settingsService.updateSettings({
        smtp_host: value.smtp_host ?? '',
        smtp_user: value.smtp_user ?? '',
        smtp_pass: value.smtp_pass || undefined,
        smtp_port: Number(value.smtp_port ?? 465)
      });
      this.smtpForm.patchValue({ smtp_pass: '' }, { emitEvent: false });
      this.smtpForm.markAsPristine();
      this.smtpForm.markAsUntouched();
      this.toastService.success('SMTP settings saved', 'Email server configuration updated.');
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

  async uploadImages(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const product = this.product();
    if (!input.files?.length || !product) {
      return;
    }

    if (this.saving()) {
      return; // Prevent double submission
    }

    this.saving.set(true);
    try {
      const files = Array.from(input.files);
      const uploadedUrls = await this.productService.uploadProductImages(files, product.id);
      
      // Get current images - prioritize image_urls array, fallback to image_url
      let currentImages: string[] = [];
      if (product.image_urls && product.image_urls.length > 0) {
        currentImages = [...product.image_urls];
      } else if (product.image_url) {
        currentImages = [product.image_url];
      }
      
      // Add new images to the array (avoid duplicates)
      const newImages = uploadedUrls.filter((url) => !currentImages.includes(url));
      const updatedImages = [...currentImages, ...newImages];
      
      // Update product with new images array and set first image as main image if none exists
      const mainImage = product.image_url || updatedImages[0] || null;
      
      await this.productService.updateProduct({
        id: product.id,
        image_url: mainImage,
        image_urls: updatedImages.length > 0 ? updatedImages : null
      });
      
      // Reload product from database to ensure we have the latest data
      const reloaded = await this.productService.loadProduct(product.id, true);
      if (reloaded) {
        this.product.set(reloaded);
      }
      
      this.toastService.success('Images uploaded', `${newImages.length} image(s) added successfully.`);
      
      // Reset file input
      input.value = '';
    } catch (error: any) {
      this.toastService.error('Upload failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
    }
  }

  async removeImage(imageUrl: string): Promise<void> {
    const product = this.product();
    if (!product) {
      return;
    }

    if (this.saving()) {
      return; // Prevent double submission
    }

    this.saving.set(true);
    try {
      const currentImages = product.image_urls ?? [];
      const updatedImages = currentImages.filter((url) => url !== imageUrl);
      
      // If we removed the main image, set the first remaining image as main
      const newMainImage = updatedImages.length > 0 ? updatedImages[0] : null;
      
      await this.productService.updateProduct({
        id: product.id,
        image_url: newMainImage,
        image_urls: updatedImages.length > 0 ? updatedImages : null
      });
      
      // Reload product from database to ensure we have the latest data
      const reloaded = await this.productService.loadProduct(product.id, true);
      if (reloaded) {
        this.product.set(reloaded);
      }
      
      this.toastService.success('Image removed', 'Product image deleted.');
    } catch (error: any) {
      this.toastService.error('Remove failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
    }
  }

  async setMainImage(imageUrl: string): Promise<void> {
    const product = this.product();
    if (!product || product.image_url === imageUrl) {
      return;
    }

    if (this.saving()) {
      return; // Prevent double submission
    }

    this.saving.set(true);
    try {
      const currentImages = product.image_urls ?? [];
      // Reorder images to put selected one first
      const reorderedImages = [imageUrl, ...currentImages.filter((url) => url !== imageUrl)];
      
      await this.productService.updateProduct({
        id: product.id,
        image_url: imageUrl,
        image_urls: reorderedImages
      });
      
      // Reload product from database to ensure we have the latest data
      const reloaded = await this.productService.loadProduct(product.id, true);
      if (reloaded) {
        this.product.set(reloaded);
      }
      
      this.toastService.success('Main image updated', 'Primary product image changed.');
    } catch (error: any) {
      this.toastService.error('Update failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
    }
  }

  getProductImages(): string[] {
    const product = this.product();
    if (!product) {
      return [];
    }
    
    // Use image_urls if available, otherwise fall back to image_url
    if (product.image_urls && product.image_urls.length > 0) {
      return product.image_urls;
    }
    if (product.image_url) {
      return [product.image_url];
    }
    return [];
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

  async saveBrandingSettings(): Promise<void> {
    if (this.brandingForm.invalid) {
      this.brandingForm.markAllAsTouched();
      this.toastService.error('Validation failed', 'Please check all required fields.');
      return;
    }

    if (this.saving()) {
      return; // Prevent double submission
    }

    this.saving.set(true);
    try {
      const value = this.brandingForm.getRawValue();
      let logoUrl: string | undefined = undefined;
      let faviconUrl: string | undefined = undefined;

      // Upload logo if a new file was selected
      if (this.logoFile()) {
        logoUrl = await this.api.uploadLogo(this.logoFile()!);
        this.logoPreview.set(logoUrl);
        this.logoFile.set(null);
      } else if (this.logoPreview()) {
        // Keep existing logo URL if no new file was selected
        logoUrl = this.logoPreview() || undefined;
      }

      // Upload favicon if a new file was selected
      if (this.faviconFile()) {
        faviconUrl = await this.api.uploadFavicon(this.faviconFile()!);
        this.faviconPreview.set(faviconUrl);
        this.faviconFile.set(null);
      } else if (this.faviconPreview()) {
        // Keep existing favicon URL if no new file was selected
        faviconUrl = this.faviconPreview() || undefined;
      }

      await this.settingsService.updateSettings({
        website_name: value.website_name ?? 'One Product Store',
        logo_url: logoUrl,
        favicon_url: faviconUrl
      });
      
      this.brandingForm.markAsPristine();
      this.brandingForm.markAsUntouched();
      this.toastService.success('Branding settings saved', 'Website branding updated.');
      
      // Reload settings store so header picks up changes
      await this.settingsStore.loadSettings(true);
      
      // Update document title and favicon immediately
      if (value.website_name) {
        document.title = value.website_name;
      }
      if (faviconUrl) {
        this.updateFavicon(faviconUrl);
      }
    } catch (error: any) {
      this.toastService.error('Update failed', error?.message ?? '');
    } finally {
      this.saving.set(false);
    }
  }

  private updateFavicon(url: string): void {
    let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.getElementsByTagName('head')[0].appendChild(link);
    }
    link.href = url;
  }
}
