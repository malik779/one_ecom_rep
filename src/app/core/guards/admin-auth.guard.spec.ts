import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { adminAuthGuard } from './admin-auth.guard';
import { AuthService } from '../services/auth.service';

describe('adminAuthGuard', () => {
  it('allows admin users', async () => {
    const authStub = {
      loading: vi.fn().mockReturnValue(false),
      initialize: vi.fn(),
      session: vi.fn().mockReturnValue({ user: { id: '1' } }),
      isAdmin: vi.fn().mockReturnValue(true)
    };
    const routerStub = { createUrlTree: vi.fn().mockReturnValue('login') };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: routerStub }
      ]
    });

    const result = await TestBed.runInInjectionContext(() => adminAuthGuard({} as any));
    expect(result).toBe(true);
  });

  it('redirects non-admin users', async () => {
    const authStub = {
      loading: vi.fn().mockReturnValue(false),
      initialize: vi.fn(),
      session: vi.fn().mockReturnValue({ user: { id: '1' } }),
      isAdmin: vi.fn().mockReturnValue(false)
    };
    const routerStub = { createUrlTree: vi.fn().mockReturnValue('login') };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthService, useValue: authStub },
        { provide: Router, useValue: routerStub }
      ]
    });

    const result = await TestBed.runInInjectionContext(() => adminAuthGuard({} as any));
    expect(result).toBe('login');
  });
});
