import { inject, Injectable } from '@angular/core';
import { SupabaseClientService } from '../services/supabase-client.service';
import { AdminAppSettings, EmailTemplate, PublicAppSettings } from '../models/settings.model';
import { Order, OrderItem, OrderSummary } from '../models/order.model';
import { PaymentConfirmation, PaymentSessionResponse } from '../models/payment.model';
import { Product } from '../models/product.model';

interface OrderFilters {
  status?: string;
  email?: string;
  startDate?: string;
  endDate?: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly client = inject(SupabaseClientService).client;

  async getPublicSettings(): Promise<PublicAppSettings | null> {
    const { data, error } = await this.client
      .from('app_settings_public')
      .select('*')
      .limit(1)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }

  async getAdminSettings(): Promise<AdminAppSettings | null> {
    const { data, error } = await this.client
      .from('app_settings')
      .select(
        'payment_gateway,payment_public_key,currency,success_url,cancel_url,product_id,sender_email,admin_email'
      )
      .limit(1)
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }

  async updateAdminSettings(settings: Partial<AdminAppSettings> & { payment_secret_key?: string }) {
    const { data, error } = await this.client.functions.invoke('admin-update-settings', {
      body: settings
    });
    if (error) {
      throw error;
    }
    return data;
  }

  async getProduct(productId?: string): Promise<Product | null> {
    let query = this.client
      .from('products')
      .select('id,name,description,price,currency,image_url,image_urls,features,is_active,size,color,material,brand,ply_rating,about')
      .eq('is_active', true);

    if (productId) {
      query = query.eq('id', productId);
    }

    const { data, error } = await query.limit(1).maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }

  async updateProduct(product: Partial<Product> & { id: string }) {
    const { data, error } = await this.client
      .from('products')
      .update(product)
      .eq('id', product.id)
      .select()
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }

  async uploadProductImage(file: File, productId: string): Promise<string> {
    const extension = file.name.split('.').pop() ?? 'png';
    const path = `product-${productId}-${Date.now()}.${extension}`;
    const { error } = await this.client.storage
      .from('product-images')
      .upload(path, file, { upsert: true, contentType: file.type });

    if (error) {
      throw error;
    }

    const { data } = this.client.storage.from('product-images').getPublicUrl(path);
    return data.publicUrl;
  }

  async createOrder(payload: Omit<Order, 'id' | 'status' | 'transaction_id' | 'created_at'>) {
    const { data, error } = await this.client
      .from('orders')
      .insert({
        ...payload,
        status: 'pending'
      })
      .select()
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }

  async createOrderItem(payload: Omit<OrderItem, 'id'>) {
    const { data, error } = await this.client.from('order_items').insert(payload).select().single();
    if (error) {
      throw error;
    }
    return data;
  }

  async listOrders(filters: OrderFilters): Promise<OrderSummary[]> {
    let query = this.client
      .from('orders')
      .select(
        'id,full_name,email,phone,billing_address,country,status,total_amount,currency,transaction_id,created_at,order_items(id,product_id,quantity,unit_price,products(name))'
      )
      .order('created_at', { ascending: false });

    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.email) {
      query = query.ilike('email', `%${filters.email}%`);
    }
    if (filters.startDate) {
      query = query.gte('created_at', filters.startDate);
    }
    if (filters.endDate) {
      query = query.lte('created_at', filters.endDate);
    }

    const { data, error } = await query;
    if (error) {
      throw error;
    }

    return (data ?? []).map((order: any) => ({
      ...order,
      items: (order.order_items ?? []).map((item: any) => ({
        ...item,
        product_name: item.products?.name ?? 'Product'
      }))
    }));
  }

  async createPaymentSession(payload: {
    orderId: string;
    successUrl: string;
    cancelUrl: string;
  }): Promise<PaymentSessionResponse> {
    const { data, error } = await this.client.functions.invoke('create-payment-session', {
      body: payload
    });
    if (error) {
      throw error;
    }
    return data as PaymentSessionResponse;
  }

  async confirmPayment(sessionId: string): Promise<PaymentConfirmation> {
    const { data, error } = await this.client.functions.invoke('confirm-payment', {
      body: { sessionId }
    });
    if (error) {
      throw error;
    }
    return data as PaymentConfirmation;
  }

  async listEmailTemplates(): Promise<EmailTemplate[]> {
    const { data, error } = await this.client
      .from('email_templates')
      .select('id,name,subject,html')
      .order('name', { ascending: true });
    if (error) {
      throw error;
    }
    return data ?? [];
  }

  async updateEmailTemplate(template: EmailTemplate) {
    const { data, error } = await this.client
      .from('email_templates')
      .update({
        subject: template.subject,
        html: template.html
      })
      .eq('id', template.id)
      .select()
      .maybeSingle();
    if (error) {
      throw error;
    }
    return data;
  }
}
