import { Component, computed, OnInit } from '@angular/core';
import { NgFor, NgIf, CurrencyPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ProductStore } from '../../../core/state/product.store';
import { SettingsStore } from '../../../core/state/settings.store';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ToastService } from '../../../core/services/toast.service';
import { Product } from '../../../core/models/product.model';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [NgFor, NgIf, CurrencyPipe, SkeletonComponent],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit {
  readonly products;
  readonly loading;
  readonly error;
  readonly settings;
  readonly currency: ReturnType<typeof computed<string>>;

  constructor(
    private readonly productStore: ProductStore,
    private readonly settingsStore: SettingsStore,
    private readonly toastService: ToastService,
    private readonly router: Router
  ) {
    this.products = this.productStore.activeProducts;
    this.loading = computed(() => this.productStore.loading() || this.settingsStore.loading());
    this.error = computed(() => this.productStore.error() || this.settingsStore.error());
    this.settings = this.settingsStore.settings;
    this.currency = computed(() => this.settings()?.currency ?? 'USD');
  }

  async ngOnInit(): Promise<void> {
    await this.settingsStore.loadSettings();
    await this.productStore.loadProducts();
    if (this.error()) {
      this.toastService.error('Unable to load products', this.error() ?? '');
    }
  }

  getProductImageUrl(product: Product): string {
    if (product.image_url) {
      return product.image_url;
    }
    if (product.image_urls && product.image_urls.length > 0) {
      return product.image_urls[0];
    }
    return 'assets/product-placeholder.svg';
  }

  navigateToProduct(productId: string): void {
    this.router.navigate(['/products', productId]);
  }
}
