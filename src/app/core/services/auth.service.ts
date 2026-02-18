import { inject, Injectable, NgZone, signal } from '@angular/core';
import { SupabaseClientService } from './supabase-client.service';
import { SupabaseSession } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly ngZone = inject(NgZone);
  private readonly supabaseClient = inject(SupabaseClientService);
  private readonly sessionSignal = signal<SupabaseSession | null>(null);
  private readonly adminSignal = signal(false);
  private readonly loadingSignal = signal(true);
  private initialized = false;

  readonly session = this.sessionSignal.asReadonly();
  readonly isAdmin = this.adminSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  constructor() {}

  private get supabase() {
    return this.supabaseClient.client;
  }

  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }
    this.initialized = true;
    const { data } = await this.supabase.auth.getSession();
    this.sessionSignal.set(data.session);
    await this.refreshAdminStatus();
    this.loadingSignal.set(false);

    this.supabase.auth.onAuthStateChange(async (_event, session) => {
      this.ngZone.run(async() => {
      this.sessionSignal.set(session);
      console.log('auth state changed', session);
        await this.refreshAdminStatus();
        this.loadingSignal.set(false);
      });
    });
  }

  async signIn(email: string, password: string): Promise<void> {
    const { error } = await this.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      throw error;
    }
  }

  async signOut(): Promise<void> {
    const { error } = await this.supabase.auth.signOut();
    if (error) {
      throw error;
    }
  }

  async refreshAdminStatus(): Promise<void> {
    const session = this.sessionSignal();
    if (!session?.user) {
      this.adminSignal.set(false);
      return;
    }
    const { data, error } = await this.supabase
      .from('admin_users')
      .select('user_id')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (error) {
      this.adminSignal.set(false);
      return;
    }
    this.adminSignal.set(Boolean(data?.user_id));
  }
}
