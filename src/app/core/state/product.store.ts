import { Injectable, signal } from '@angular/core';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';
import { ProductService } from '../services/product.service';
import { mockProduct } from './mock-data';

@Injectable({ providedIn: 'root' })
export class ProductStore {
  private readonly productSignal = signal<Product | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly product = this.productSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private readonly productService: ProductService) {}

  async loadProduct(productId?: string): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      if (environment.useMockData) {
        this.productSignal.set(mockProduct);
        return;
      }
      const product = await this.productService.loadProduct(productId);
      this.productSignal.set(product);
    } catch (error: any) {
      this.errorSignal.set(error?.message ?? 'Unable to load product.');
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
