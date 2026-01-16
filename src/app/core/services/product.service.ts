import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private readonly api = inject(ApiService);

  loadProduct(productId?: string): Promise<Product | null> {
    return this.api.getProduct(productId);
  }

  updateProduct(product: Partial<Product> & { id: string }) {
    return this.api.updateProduct(product);
  }

  uploadProductImage(file: File, productId: string) {
    return this.api.uploadProductImage(file, productId);
  }
}
