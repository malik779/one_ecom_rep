import { Routes } from '@angular/router';
import { adminAuthGuard } from './core/guards/admin-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/public/public-layout/public-layout.component').then(
        (m) => m.PublicLayoutComponent
      ),
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/public/product-page/product-page.component').then(
            (m) => m.ProductPageComponent
          ),
        title: 'Product'
      },
      {
        path: 'checkout',
        loadComponent: () =>
          import('./features/public/checkout-page/checkout-page.component').then(
            (m) => m.CheckoutPageComponent
          ),
        title: 'Checkout'
      },
      {
        path: 'payment/success',
        loadComponent: () =>
          import('./features/public/payment-success-page/payment-success-page.component').then(
            (m) => m.PaymentSuccessPageComponent
          ),
        title: 'Payment Success'
      },
      {
        path: 'payment/failure',
        loadComponent: () =>
          import('./features/public/payment-failure-page/payment-failure-page.component').then(
            (m) => m.PaymentFailurePageComponent
          ),
        title: 'Payment Failed'
      }
    ]
  },
  {
    path: 'admin',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/admin/admin-login/admin-login.component').then(
            (m) => m.AdminLoginComponent
          ),
        title: 'Admin Login'
      },
      {
        path: '',
        canActivate: [adminAuthGuard],
        loadComponent: () =>
          import('./features/admin/admin-layout/admin-layout.component').then(
            (m) => m.AdminLayoutComponent
          ),
        children: [
          { path: '', pathMatch: 'full', redirectTo: 'orders' },
          {
            path: 'orders',
            loadComponent: () =>
              import('./features/admin/orders-page/orders-page.component').then(
                (m) => m.OrdersPageComponent
              ),
            title: 'Orders'
          },
          {
            path: 'settings',
            loadComponent: () =>
              import('./features/admin/settings-page/settings-page.component').then(
                (m) => m.SettingsPageComponent
              ),
            title: 'Settings'
          }
        ]
      }
    ]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
