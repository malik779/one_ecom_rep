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
    fullName?: string;
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

  async deleteOrder(orderId: string): Promise<void> {
    this.errorSignal.set(null);
    await this.orderService.deleteOrder(orderId);
    this.ordersSignal.update((orders) => orders.filter((o) => o.id !== orderId));
  }

  async deleteOrders(orderIds: string[]): Promise<void> {
    if (orderIds.length === 0) return;
    this.errorSignal.set(null);
    await this.orderService.deleteOrders(orderIds);
    const idSet = new Set(orderIds);
    this.ordersSignal.update((orders) => orders.filter((o) => !idSet.has(o.id)));
  }
}
