import { Component, computed, OnInit } from '@angular/core';
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
  readonly product = this.productStore.product;
  readonly settings = this.settingsStore.settings;
  readonly loading = computed(() => this.productStore.loading() || this.settingsStore.loading());
  readonly error = computed(() => this.productStore.error() || this.settingsStore.error());

  readonly currency = computed(
    () => this.product()?.currency ?? this.settings()?.currency ?? 'USD'
  );

  readonly imageUrl = computed(() => this.product()?.image_url ?? '/product-placeholder.svg');

  constructor(
    private readonly productStore: ProductStore,
    private readonly settingsStore: SettingsStore,
    private readonly toastService: ToastService
  ) {}

  async ngOnInit(): Promise<void> {
    await this.settingsStore.loadSettings();
    const productId = this.settingsStore.settings()?.product_id ?? undefined;
    await this.productStore.loadProduct(productId);
    if (this.error()) {
      this.toastService.error('Unable to load product', this.error() ?? '');
    }
  }
}
