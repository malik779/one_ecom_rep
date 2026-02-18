import { Component, OnInit, OnDestroy, AfterViewInit, ViewChild, signal, inject, ChangeDetectorRef } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { DatePipe, CurrencyPipe, NgIf, NgFor } from '@angular/common';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { OrdersStore } from '../../../core/state/orders.store';
import { OrderSummary } from '../../../core/models/order.model';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';
import { TimeAgoPipe } from '../../../shared/pipes/time-ago.pipe';
import { isWithinLast24Hours } from '../../../shared/utils/date.util';
import { firstValueFrom } from 'rxjs';
import { ConfirmDialogComponent, ConfirmDialogData } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { OrderDetailsDialogComponent } from './order-details-dialog.component';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatChipsModule,
    MatTooltipModule,
    MatCheckboxModule,
    MatDialogModule,
    MatSnackBarModule,
    NgIf,
    NgFor,
    DatePipe,
    CurrencyPipe,
    SkeletonComponent,
    TimeAgoPipe
  ],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss'
})
export class OrdersPageComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;
  
  private readonly formBuilder: FormBuilder = inject(FormBuilder);
  private readonly ordersStore: OrdersStore = inject(OrdersStore);
  private readonly dialog: MatDialog = inject(MatDialog);
  private readonly cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private readonly snackBar: MatSnackBar = inject(MatSnackBar);
  
  readonly filtersForm: ReturnType<FormBuilder['group']>;
  readonly displayedColumns: string[] = ['select', 'created_at', 'full_name', 'email', 'status', 'total_amount', 'transaction_id', 'actions'];
  readonly dataSource = new MatTableDataSource<OrderSummary>([]);
  readonly orders;
  readonly loading;
  readonly error;
  readonly statusOptions = ['pending', 'paid', 'failed', 'refunded'];
  readonly selectedOrderIds = signal<Set<string>>(new Set());

  constructor() {
    this.filtersForm = this.formBuilder.group({
      status: [''],
      email: [''],
      customerName: [''],
      startDate: [''],
      endDate: ['']
    });
    this.orders = this.ordersStore.orders;
    this.loading = this.ordersStore.loading;
    this.error = this.ordersStore.error;
  }

  async ngOnInit(): Promise<void> {
    this.setupFilters();
    await this.applyFilters();
  }

  ngAfterViewInit(): void {
    this.setSortingDataAccessor();
    this.connectPaginatorAndSort();
  }

  private setSortingDataAccessor(): void {
    this.dataSource.sortingDataAccessor = (item, property) => {
      switch (property) {
        case 'created_at':
          return new Date(item.created_at || '').getTime();
        case 'total_amount':
          return item.total_amount;
        default:
          return (item as unknown as Record<string, unknown>)[property] as string | number;
      }
    };
  }

  private connectPaginatorAndSort(): void {
    if (this.paginator) {
      this.dataSource.paginator = this.paginator;
    }
    if (this.sort) {
      this.dataSource.sort = this.sort;
    }
  }

  private setupFilters(): void {
    // Apply filter when any filter field changes
    this.filtersForm.valueChanges.subscribe(() => {
      this.applyFilter();
    });
  }

  private applyFilter(): void {
    const emailFilter = this.filtersForm.get('email')?.value || '';
    const customerNameFilter = this.filtersForm.get('customerName')?.value || '';
    const statusFilter = this.filtersForm.get('status')?.value || '';
    const startDateFilter = this.filtersForm.get('startDate')?.value || '';
    const endDateFilter = this.filtersForm.get('endDate')?.value || '';

    this.dataSource.filterPredicate = (data: OrderSummary, filter: string) => {
      const emailMatch = !emailFilter || data.email.toLowerCase().includes(emailFilter.toLowerCase());
      const customerNameMatch = !customerNameFilter || data.full_name.toLowerCase().includes(customerNameFilter.toLowerCase());
      const statusMatch = !statusFilter || data.status === statusFilter;
      
      let dateMatch = true;
      if (startDateFilter || endDateFilter) {
        const orderDate = new Date(data.created_at);
        if (startDateFilter) {
          const startDate = new Date(startDateFilter);
          startDate.setHours(0, 0, 0, 0);
          dateMatch = dateMatch && orderDate >= startDate;
        }
        if (endDateFilter) {
          const endDate = new Date(endDateFilter);
          endDate.setHours(23, 59, 59, 999);
          dateMatch = dateMatch && orderDate <= endDate;
        }
      }
      
      return emailMatch && customerNameMatch && statusMatch && dateMatch;
    };

    this.dataSource.filter = emailFilter + customerNameFilter + statusFilter + startDateFilter + endDateFilter;
    if (this.dataSource.paginator) {
      this.dataSource.paginator.firstPage();
    }
  }

  async applyFilters(): Promise<void> {
    const filters = this.filtersForm.getRawValue();
    await this.ordersStore.loadOrders({
      status: filters.status || undefined,
      email: filters.email || undefined,
      fullName: filters.customerName || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    });

    const orders = this.orders();
    this.dataSource.data = orders;
    this.applyFilter();

    // Paginator/sort live inside *ngIf="!loading()", so they are not in DOM until after load.
    // Run after view updates so ViewChild references are available.
    this.cdr.detectChanges();
    setTimeout(() => this.connectPaginatorAndSort(), 0);
  }

  selectOrder(order: OrderSummary): void {
    const dialogRef = this.dialog.open(OrderDetailsDialogComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      data: order,
      disableClose: false
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid':
        return 'status-paid';
      case 'pending':
        return 'status-pending';
      case 'failed':
        return 'status-failed';
      case 'refunded':
        return 'status-refunded';
      default:
        return '';
    }
  }

  formatStatus(status: string): string {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  /** True if order was created within the last 24 hours (for "new" badge). */
  isNewOrder(createdAt: string | null | undefined): boolean {
    return isWithinLast24Hours(createdAt);
  }

  async deleteOrder(order: OrderSummary): Promise<void> {
    const dateStr = order.created_at ? new Date(order.created_at).toLocaleDateString() : '';
    const data: ConfirmDialogData = {
      title: 'Delete order',
      message: `Are you sure you want to delete this order (${order.full_name}, ${dateStr})?\n\nThis action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Cancel',
      confirmColor: 'warn'
    };
    const confirmed = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '400px' }).afterClosed()
    );
    if (confirmed !== true) return;
    try {
      await this.ordersStore.deleteOrder(order.id);
      this.clearSelectionForIds([order.id]);
      this.dataSource.data = this.orders();
      this.snackBar.open(`Order for ${order.full_name} has been deleted.`, 'Close', {
        duration: 5000,
        panelClass: ['snackbar-success']
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unable to delete order.';
      this.snackBar.open(`Delete failed: ${msg}`, 'Close', {
        duration: 7000,
        panelClass: ['snackbar-error']
      });
    }
  }

  isOrderSelected(orderId: string): boolean {
    return this.selectedOrderIds().has(orderId);
  }

  toggleOrderSelection(orderId: string): void {
    this.selectedOrderIds.update((set) => {
      const next = new Set(set);
      if (next.has(orderId)) next.delete(orderId);
      else next.add(orderId);
      return next;
    });
  }

  isAllOnPageSelected(): boolean {
    const rows = this.dataSource.filteredData;
    if (rows.length === 0) return false;
    return rows.every((row) => this.selectedOrderIds().has(row.id));
  }

  isSomeOnPageSelected(): boolean {
    const rows = this.dataSource.filteredData;
    if (rows.length === 0) return false;
    const selected = this.selectedOrderIds();
    return rows.some((row) => selected.has(row.id));
  }

  toggleSelectAllOnPage(): void {
    const rows = this.dataSource.filteredData;
    const allSelected = this.isAllOnPageSelected();
    this.selectedOrderIds.update((set) => {
      const next = new Set(set);
      rows.forEach((row) => (allSelected ? next.delete(row.id) : next.add(row.id)));
      return next;
    });
  }

  getSelectedCount(): number {
    return this.selectedOrderIds().size;
  }

  getSelectedIds(): string[] {
    return Array.from(this.selectedOrderIds());
  }

  clearSelection(): void {
    this.selectedOrderIds.set(new Set());
  }

  private clearSelectionForIds(ids: string[]): void {
    if (ids.length === 0) return;
    const idSet = new Set(ids);
    this.selectedOrderIds.update((set) => {
      const next = new Set(set);
      idSet.forEach((id) => next.delete(id));
      return next;
    });
  }

  async deleteSelectedOrders(): Promise<void> {
    const ids = this.getSelectedIds();
    if (ids.length === 0) return;
    const data: ConfirmDialogData = {
      title: 'Delete selected orders',
      message: `Are you sure you want to delete ${ids.length} selected order(s)?\n\nThis action cannot be undone.`,
      confirmLabel: 'Delete selected',
      cancelLabel: 'Cancel',
      confirmColor: 'warn'
    };
    const confirmed = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '400px' }).afterClosed()
    );
    if (confirmed !== true) return;
    try {
      await this.ordersStore.deleteOrders(ids);
      this.clearSelection();
      this.dataSource.data = this.orders();
      this.snackBar.open(`${ids.length} order(s) have been deleted.`, 'Close', {
        duration: 5000,
        panelClass: ['snackbar-success']
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unable to delete orders.';
      this.snackBar.open(`Delete failed: ${msg}`, 'Close', {
        duration: 7000,
        panelClass: ['snackbar-error']
      });
    }
  }

  async emptyAllOrders(): Promise<void> {
    const total = this.orders().length;
    if (total === 0) return;
    const data: ConfirmDialogData = {
      title: 'Empty all orders',
      message: `Are you sure you want to delete ALL ${total} order(s)?\n\nThis action cannot be undone.`,
      confirmLabel: 'Delete all',
      cancelLabel: 'Cancel',
      confirmColor: 'warn'
    };
    const confirmed = await firstValueFrom(
      this.dialog.open(ConfirmDialogComponent, { data, width: '400px' }).afterClosed()
    );
    if (confirmed !== true) return;
    try {
      const allIds = this.orders().map((o) => o.id);
      await this.ordersStore.deleteOrders(allIds);
      this.clearSelection();
      this.dataSource.data = this.orders();
      this.snackBar.open('All orders have been removed.', 'Close', {
        duration: 5000,
        panelClass: ['snackbar-success']
      });
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unable to delete orders.';
      this.snackBar.open(`Delete failed: ${msg}`, 'Close', {
        duration: 7000,
        panelClass: ['snackbar-error']
      });
    }
  }

  ngOnDestroy(): void {
    // MatDialog handles cleanup automatically
  }
}
