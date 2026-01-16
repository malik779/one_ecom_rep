import { Injectable, signal } from '@angular/core';
import { OrderSummary } from '../models/order.model';
import { OrderService } from '../services/order.service';

@Injectable({ providedIn: 'root' })
export class OrdersStore {
  private readonly ordersSignal = signal<OrderSummary[]>([]);
  private readonly loadingSignal = signal(false);
  private readonly errorSignal = signal<string | null>(null);

  readonly orders = this.ordersSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();
  readonly error = this.errorSignal.asReadonly();

  constructor(private readonly orderService: OrderService) {}

  async loadOrders(filters: {
    status?: string;
    email?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<void> {
    this.loadingSignal.set(true);
    this.errorSignal.set(null);
    try {
      const orders = await this.orderService.listOrders(filters);
      this.ordersSignal.set(orders);
    } catch (error: any) {
      this.errorSignal.set(error?.message ?? 'Unable to load orders.');
    } finally {
      this.loadingSignal.set(false);
    }
  }
}
