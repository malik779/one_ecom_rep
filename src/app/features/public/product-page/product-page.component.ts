import { Component, computed, OnInit, signal } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ProductStore } from '../../../core/state/product.store';
import { SettingsStore } from '../../../core/state/settings.store';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-page',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, RouterLink, SkeletonComponent],
  templateUrl: './product-page.component.html',
  styleUrl: './product-page.component.scss'
})
export class ProductPageComponent implements OnInit {
  readonly product;
  readonly settings;
  readonly loading;
  readonly error;

  readonly currency: ReturnType<typeof computed<string>>;

  readonly imageUrl: ReturnType<typeof computed<string>>;
  readonly imageUrls: ReturnType<typeof computed<string[]>>;
  readonly selectedImageIndex = signal<number>(0);
  readonly selectedImage = computed(() => {
    const urls = this.imageUrls();
    const index = this.selectedImageIndex();
    return urls.length > 0 ? urls[index] : this.imageUrl();
  });

  constructor(
    private readonly productStore: ProductStore,
    private readonly settingsStore: SettingsStore,
    private readonly toastService: ToastService
  ) {
    this.product = this.productStore.product;
    this.settings = this.settingsStore.settings;
    this.loading = computed(() => this.productStore.loading() || this.settingsStore.loading());
    this.error = computed(() => this.productStore.error() || this.settingsStore.error());
    this.currency = computed(
      () => this.product()?.currency ?? this.settings()?.currency ?? 'USD'
    );
    this.imageUrl = computed(() => this.product()?.image_url ?? '/product-placeholder.svg');
    this.imageUrls = computed(() => {
      const product = this.product();
      if (product?.image_urls && product.image_urls.length > 0) {
        return product.image_urls;
      }
      if (product?.image_url) {
        return [product.image_url];
      }
      return ['/product-placeholder.svg'];
    });
  }

  selectImage(index: number): void {
    this.selectedImageIndex.set(index);
  }

  async ngOnInit(): Promise<void> {
    await this.settingsStore.loadSettings();
    const productId = this.settingsStore.settings()?.product_id ?? undefined;
    await this.productStore.loadProduct(productId);
    this.selectedImageIndex.set(0);
    if (this.error()) {
      this.toastService.error('Unable to load product', this.error() ?? '');
    }
  }
}
