import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class Supabase implements OnModuleInit {
  private client: SupabaseClient;

  constructor(private readonly configService: ConfigService) {
  }

  onModuleInit() {
    this.client = createClient(
      this.configService.get('supabase.url')!,
      this.configService.get('supabase.key')!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
      },
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Returns the singleton client for use with a caller-supplied access token.
   * The Supabase JS SDK has no safe per-call auth override on a shared singleton
   * (global.headers is init-time; setSession mutates shared state).
   * For operations requiring user-scoped auth (e.g. updating user metadata or
   * password), callers should make direct Supabase REST calls with the token in
   * the Authorization header — see AuthService and UsersService for examples.
   */
  getAuthenticatedClient(_accessToken: string): SupabaseClient {
    return this.client;
  }
}
