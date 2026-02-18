import { Component, computed, OnInit, OnDestroy, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { Router, RouterLink, NavigationEnd, ActivatedRoute } from '@angular/router';
import { filter, takeUntil } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { ProductStore } from '../../../core/state/product.store';
import { SettingsStore } from '../../../core/state/settings.store';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ToastService } from '../../../core/services/toast.service';
import { LoadingService } from '../../../core/services/loading.service';
import { QuantitySelectorComponent } from '../../../shared/components/quantity-selector/quantity-selector.component';
import { BackButtonComponent } from '../../../shared/components/back-button/back-button.component';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, SkeletonComponent, QuantitySelectorComponent, BackButtonComponent],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.scss'
})
export class ProductPageComponent implements OnInit, OnDestroy {
  private readonly destroy$ = new Subject<void>();
  readonly product;
  readonly settings;
  readonly loading;
  readonly error;

  readonly currency: ReturnType<typeof computed<string>>;

  readonly imageUrl: ReturnType<typeof computed<string>>;
  readonly imageUrls: ReturnType<typeof computed<string[]>>;
  readonly selectedImageIndex = signal<number>(0);
  readonly quantity = signal<number>(1);
  readonly selectedImage = computed(() => {
    const urls = this.imageUrls();
    const index = this.selectedImageIndex();
    return urls.length > 0 ? urls[index] : this.imageUrl();
  });

  constructor(
    private readonly productStore: ProductStore,
    private readonly settingsStore: SettingsStore,
    private readonly toastService: ToastService,
    private readonly loadingService: LoadingService,
    private readonly router: Router,
    private readonly route: ActivatedRoute
  ) {
    this.product = this.productStore.product;
    this.settings = this.settingsStore.settings;
    this.loading = computed(() => this.productStore.loading() || this.settingsStore.loading());
    this.error = computed(() => this.productStore.error() || this.settingsStore.error());
    this.currency = computed(
      () => this.product()?.currency ?? this.settings()?.currency ?? 'USD'
    );
    this.imageUrl = computed(() => this.product()?.image_url ?? 'assets/product-placeholder.svg');
    this.imageUrls = computed(() => {
      const product = this.product();
      if (product?.image_urls && product.image_urls.length > 0) {
        return product.image_urls;
      }
      if (product?.image_url) {
        return [product.image_url];
      }
      return ['assets/product-placeholder.svg'];
    });
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  onQuantityChange(quantity: number): void {
    this.quantity.set(quantity);
  }

  async navigateToCheckout(): Promise<void> {
    if (!this.product()) {
      this.toastService.error('Product not available', 'Please wait for the product to load.');
      return;
    }
    this.loadingService.show('Redirecting to checkout...');
    try {
      // Small delay to ensure loader is visible
      await new Promise(resolve => setTimeout(resolve, 50));
      await this.router.navigate(['/checkout'], { 
        queryParams: { 
          productId: this.product()!.id,
          quantity: this.quantity()
        } 
      });
      // Router loading service will handle hiding the loader
    } catch (error) {
      this.loadingService.hide();
      this.toastService.error('Navigation failed', 'Unable to navigate to checkout.');
    }
  }

  private async loadData(productId: string): Promise<void> {
    await this.settingsStore.loadSettings();
    await this.productStore.loadProduct(productId, true);
    this.selectedImageIndex.set(0);
    if (this.error()) {
      this.toastService.error('Unable to load product', this.error() ?? '');
    }
  }

  async ngOnInit(): Promise<void> {
    // Get product ID from route params
    const productId = this.route.snapshot.paramMap.get('id');
    if (!productId) {
      this.toastService.error('Invalid product', 'Product ID is required.');
      await this.router.navigate(['/']);
      return;
    }

    await this.loadData(productId);

    // Reload data when route params change
    this.route.paramMap
      .pipe(takeUntil(this.destroy$))
      .subscribe(async (params) => {
        const id = params.get('id');
        if (id) {
          await this.loadData(id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
