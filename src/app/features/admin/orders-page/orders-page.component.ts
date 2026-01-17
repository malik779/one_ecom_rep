import { Component, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { NgFor, NgIf, DatePipe, CurrencyPipe, NgClass } from '@angular/common';
import { OrdersStore } from '../../../core/state/orders.store';
import { OrderSummary } from '../../../core/models/order.model';
import { SkeletonComponent } from '../../../shared/components/skeleton/skeleton.component';

@Component({
  selector: 'app-orders-page',
  standalone: true,
  imports: [ReactiveFormsModule, NgFor, NgIf, DatePipe, CurrencyPipe, NgClass, SkeletonComponent],
  templateUrl: './orders-page.component.html',
  styleUrl: './orders-page.component.scss'
})
export class OrdersPageComponent implements OnInit {
  readonly filtersForm: ReturnType<FormBuilder['group']>;
  readonly selectedOrder = signal<OrderSummary | null>(null);
  readonly orders;
  readonly loading;
  readonly error;

  readonly statusOptions = ['pending', 'paid', 'failed', 'refunded'];

  constructor(private readonly formBuilder: FormBuilder, private readonly ordersStore: OrdersStore) {
    this.filtersForm = this.formBuilder.group({
      status: [''],
      email: [''],
      startDate: [''],
      endDate: ['']
    });
    this.orders = this.ordersStore.orders;
    this.loading = this.ordersStore.loading;
    this.error = this.ordersStore.error;
  }

  async ngOnInit(): Promise<void> {
    await this.applyFilters();
  }

  async applyFilters(): Promise<void> {
    const filters = this.filtersForm.getRawValue();
    await this.ordersStore.loadOrders({
      status: filters.status || undefined,
      email: filters.email || undefined,
      startDate: filters.startDate || undefined,
      endDate: filters.endDate || undefined
    });
  }

  selectOrder(order: OrderSummary) {
    this.selectedOrder.set(order);
  }
}
