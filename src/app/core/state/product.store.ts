import { Injectable, signal, computed } from '@angular/core';
import { environment } from '@environments/environment';
import { Product } from '../models/product.model';
import { ProductService } from '../services/product.service';
import { mockProduct } from './mock-data';

@Injectable({ providedIn: 'root' })
export class ProductStore {
  private readonly productsSignal = signal<Product[]>([]);
  private readonly currentProductSignal = signal<Product | null>(null);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly products = this.productsSignal.asReadonly();
  readonly product = this.currentProductSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  readonly activeProducts = computed(() => 
    this.products().filter(p => p.is_active)
  );

  constructor(private readonly productService: ProductService) {}

  async loadProduct(productId: string, force = false, includeInactive = false): Promise<void> {
    if (this.loadingSignal() && !force) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      if (environment.useMockData) {
        this.currentProductSignal.set(mockProduct);
        this.loadingSignal.set(false);
        return;
      }
      const product = await this.productService.loadProduct(productId, includeInactive);
      this.currentProductSignal.set(product);
    } catch (error: any) {
      this.errorSignal.set(error?.message ?? 'Unable to load product.');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  async loadProducts(includeInactive = false, force = false): Promise<void> {
    if (this.loadingSignal() && !force) {
      return;
    }

    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      if (environment.useMockData) {
        this.productsSignal.set([mockProduct]);
        this.loadingSignal.set(false);
        return;
      }
      const products = await this.productService.loadAllProducts(includeInactive);
      this.productsSignal.set(products);
    } catch (error: any) {
      this.errorSignal.set(error?.message ?? 'Unable to load products.');
    } finally {
      this.loadingSignal.set(false);
    }
  }

  setProduct(product: Product | null): void {
    this.currentProductSignal.set(product);
  }

  addProduct(product: Product): void {
    this.productsSignal.update(products => [...products, product]);
  }

  updateProductInList(product: Product): void {
    this.productsSignal.update(products =>
      products.map(p => p.id === product.id ? product : p)
    );
    if (this.currentProductSignal()?.id === product.id) {
      this.currentProductSignal.set(product);
    }
  }

  removeProductFromList(productId: string): void {
    this.productsSignal.update(products => products.filter(p => p.id !== productId));
    if (this.currentProductSignal()?.id === productId) {
      this.currentProductSignal.set(null);
    }
  }

  clear(): void {
    this.productsSignal.set([]);
    this.currentProductSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
  }
}
