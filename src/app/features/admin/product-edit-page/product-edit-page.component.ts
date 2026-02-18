import { Component, computed, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { ProductStore } from '../../../core/state/product.store';
import { Product } from '../../../core/models/product.model';
import { ProductFormComponent } from '../../../shared/components/product-form/product-form.component';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-product-edit-page',
  standalone: true,
  imports: [NgIf, ProductFormComponent, SkeletonComponent],
  templateUrl: './product-edit-page.component.html',
  styleUrl: './product-edit-page.component.scss'
})
export class ProductEditPageComponent implements OnInit {
  product=computed(()=>this.productStore.product());
  mode: 'create' | 'edit' = 'create';
  loading=computed(()=>this.productStore.loading());
  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productStore: ProductStore,
    private readonly toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.loadProduct();
  }

  private async loadProduct(): Promise<void> {
    const productId = this.route.snapshot.paramMap.get('id');
    
    if (productId === 'new') {
      this.mode = 'create';
      this.productStore.setProduct(null);
    } else if (productId) {
      this.mode = 'edit';
      try {
        await this.productStore.loadProduct(productId, true, true); // force reload, include inactive
        if (!this.product) {
          this.toastService.error('Product not found', 'The product you are looking for does not exist.');
          await this.router.navigate(['/admin/products']);
        }
      } catch (error: any) {
        this.toastService.error('Failed to load product', error?.message ?? '');
        await this.router.navigate(['/admin/products']);
      }
    } else {
      this.toastService.error('Invalid route', 'Product ID is required.');
      this.router.navigate(['/admin/products']);
    }
  }

  async onSaved(product: Product): Promise<void> {
    this.productStore.updateProductInList(product);
    if (this.mode === 'create') {
      this.productStore.addProduct(product);
    }
    await this.router.navigate(['/admin/products']);
  }

  async onCancelled(): Promise<void> {
    await this.router.navigate(['/admin/products']);
  }
}
