import { Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-admin-login',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './admin-login.component.html',
  styleUrl: './admin-login.component.scss'
})
export class AdminLoginComponent {
  readonly loading = signal(false);
  readonly form = this.formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(
    private readonly formBuilder: FormBuilder,
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly toastService: ToastService
  ) {}

  async submit(): Promise<void> {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    try {
      await this.authService.signIn(
        this.form.get('email')?.value ?? '',
        this.form.get('password')?.value ?? ''
      );
      await this.authService.refreshAdminStatus();
      if (!this.authService.isAdmin()) {
        await this.authService.signOut();
        throw new Error('Account does not have admin access.');
      }
      await this.router.navigate(['/admin/orders']);
    } catch (error: any) {
      this.toastService.error('Login failed', error?.message ?? 'Unable to authenticate.');
    } finally {
      this.loading.set(false);
    }
  }
}
