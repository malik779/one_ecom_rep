import { Injectable, signal } from '@angular/core';
import { Session } from '@supabase/supabase-js';
import { SupabaseClientService } from './supabase-client.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly supabase = this.supabaseClient.client;
  private readonly sessionSignal = signal<Session | null>(null);
  private readonly adminSignal = signal(false);
  private readonly loadingSignal = signal(true);
  private initialized = false;

  readonly session = this.sessionSignal.asReadonly();
  readonly isAdmin = this.adminSignal.asReadonly();
  readonly loading = this.loadingSignal.asReadonly();

  constructor(private readonly supabaseClient: SupabaseClientService) {}

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
      this.sessionSignal.set(session);
      await this.refreshAdminStatus();
      this.loadingSignal.set(false);
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
