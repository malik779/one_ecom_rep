import { inject, Injectable } from '@angular/core';
import { ApiService } from '../api/api';
import { Order, OrderItem, OrderSummary } from '../models/order.model';

interface OrderCreatePayload {
  full_name: string;
  email: string;
  phone: string;
  billing_address: string;
  country: string;
  total_amount: number;
  currency: string;
}

@Injectable({ providedIn: 'root' })
export class OrderService {
  private readonly api = inject(ApiService);

  createOrder(payload: OrderCreatePayload): Promise<Order> {
    return this.api.createOrder(payload);
  }

  createOrderItem(payload: Omit<OrderItem, 'id'>) {
    return this.api.createOrderItem(payload);
  }

  listOrders(filters: {
    status?: string;
    email?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<OrderSummary[]> {
    return this.api.listOrders(filters);
  }
}
