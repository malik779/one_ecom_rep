import { Injectable, signal } from '@angular/core';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  title: string;
  message: string;
  type: ToastType;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private readonly toastsSignal = signal<ToastMessage[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  show(title: string, message: string, type: ToastType = 'info') {
    const toast: ToastMessage = {
      id: crypto.randomUUID(),
      title,
      message,
      type
    };
    this.toastsSignal.update((current) => [...current, toast]);
    window.setTimeout(() => this.dismiss(toast.id), 5000);
  }

  success(title: string, message: string) {
    this.show(title, message, 'success');
  }

  error(title: string, message: string) {
    this.show(title, message, 'error');
  }

  dismiss(id: string) {
    this.toastsSignal.update((current) => current.filter((toast) => toast.id !== id));
  }
}
