export type OrderStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  billing_address: string;
  country: string;
  status: OrderStatus;
  total_amount: number;
  currency: string;
  transaction_id: string | null;
  created_at: string;
  /** Set when order is soft-deleted; null means active. */
  deleted_at?: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name?: string;
}

export interface OrderSummary extends Order {
  items: OrderItem[];
}
