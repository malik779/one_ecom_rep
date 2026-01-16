import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const adminAuthGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.loading()) {
    await authService.initialize();
  }

  const session = authService.session();
  if (!session) {
    return router.createUrlTree(['/admin/login']);
  }

  if (!authService.isAdmin()) {
    return router.createUrlTree(['/admin/login']);
  }

  return true;
};
