import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  loadProduct(productId: string, includeInactive = false): Promise<Product | null> {
    return this.api.getProduct(productId, includeInactive);
  }

  loadAllProducts(includeInactive = false): Promise<Product[]> {
    return this.api.getAllProducts(includeInactive);
  }

  createProduct(product: Omit<Product, 'id'>): Promise<Product> {
    return this.api.createProduct(product);
  }

  updateProduct(product: Partial<Product> & { id: string }) {
    return this.api.updateProduct(product);
  }

  deleteProduct(productId: string): Promise<void> {
    return this.api.deleteProduct(productId);
  }

  uploadProductImage(file: File, productId: string) {
    return this.api.uploadProductImage(file, productId);
  }

  uploadProductImages(files: File[], productId: string) {
    return this.api.uploadProductImages(files, productId);
  }
}
