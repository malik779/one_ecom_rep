import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '@environments/environment';

@Injectable({ providedIn: 'root' })
export class SupabaseClientService {
  private readonly supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabase.url, environment.supabase.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storage: localStorage, // Explicitly set storage
        storageKey: 'supabase.auth.token', // Custom storage key if needed
        flowType: 'pkce', // Use PKCE flow for better security
      }
    });
  }

  get client(): SupabaseClient {
    return this.supabase;
  }
}
