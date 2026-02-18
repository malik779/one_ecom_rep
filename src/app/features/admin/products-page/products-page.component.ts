import { Component, OnInit, AfterViewInit, ViewChild, signal, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { NgIf, CurrencyPipe, DatePipe } from '@angular/common';
import { ProductStore } from '../../../core/state/product.store';
import { Product } from '../../../core/models/product.model';
import { ToastService } from '../../../core/services/toast.service';
import { ProductService } from '../../../core/services/product.service';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-products-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatDialogModule,
    NgIf,
    CurrencyPipe,
    DatePipe,
    RouterLink,
    SkeletonComponent
  ],
  templateUrl: './products-page.component.html',
  styleUrl: './products-page.component.scss'
})
export class ProductsPageComponent implements OnInit, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly productStore: ProductStore = inject(ProductStore);
  private readonly productService: ProductService = inject(ProductService);
  private readonly toastService: ToastService = inject(ToastService);
  private readonly router: Router = inject(Router);
  private readonly dialog: MatDialog = inject(MatDialog);
  readonly displayedColumns: string[] = ['name', 'price', 'currency', 'status', 'created_at', 'actions'];
  readonly dataSource = new MatTableDataSource<Product>([]);
  readonly loading = signal(false);
  readonly searchForm = this.formBuilder.group({
    search: ['']
  });

  constructor(

  ) {}

  ngOnInit(): void {
    this.setupSearch();
    this.loadProducts();
  }

  ngAfterViewInit(): void {
    this.dataSource.paginator = this.paginator;
    this.dataSource.sort = this.sort;
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'created_at':
          return new Date(item.created_at || '').getTime();
        default:
          return (item as any)[property];
      }
    };
  }

  private setupSearch(): void {
    this.searchForm.get('search')?.valueChanges.subscribe((value) => {
      this.applyFilter(value || '');
    });
  }

  private applyFilter(filterValue: string): void {
    this.dataSource.filter = filterValue.trim().toLowerCase();
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    try {
      await this.productStore.loadProducts(true); // Include inactive
      const products = this.productStore.products();
      this.dataSource.data = products;
    } catch (error: any) {
      this.toastService.error('Failed to load products', error?.message ?? '');
    } finally {
      this.loading.set(false);
    }
  }

  async deleteProduct(product: Product): Promise<void> {
    if (!confirm(`Are you sure you want to delete "${product.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await this.productService.deleteProduct(product.id);
      this.productStore.removeProductFromList(product.id);
      this.dataSource.data = this.productStore.products();
      this.toastService.success('Product deleted', `${product.name} has been deleted.`);
    } catch (error: any) {
      this.toastService.error('Delete failed', error?.message ?? '');
    }
  }

  async toggleProductStatus(product: Product): Promise<void> {
    try {
      const updated = await this.productService.updateProduct({
        id: product.id,
        is_active: !product.is_active
      });
      this.productStore.updateProductInList(updated);
      this.dataSource.data = this.productStore.products();
      this.toastService.success(
        'Status updated',
        `${product.name} is now ${updated.is_active ? 'active' : 'inactive'}.`
      );
    } catch (error: any) {
      this.toastService.error('Update failed', error?.message ?? '');
    }
  }

  navigateToEdit(productId: string): void {
    this.router.navigate(['/admin/products', productId, 'edit']);
  }

  navigateToCreate(): void {
    this.router.navigate(['/admin/products', 'new', 'edit']);
  }

  getStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }
}
