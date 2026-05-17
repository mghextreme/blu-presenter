import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class Supabase implements OnModuleInit {
  private client: SupabaseClient;
  private adminClient: SupabaseClient | null = null;

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

    const serviceRoleKey = this.configService.get<string>('supabase.serviceRoleKey');
    if (serviceRoleKey) {
      this.adminClient = createClient(
        this.configService.get('supabase.url')!,
        serviceRoleKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
            detectSessionInUrl: false,
          },
        },
      );
    }
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

  /**
   * Returns the admin client backed by the SUPABASE_SERVICE_ROLE_KEY. NEVER
   * expose this to the frontend. Used for privileged operations such as
   * `auth.admin.signOut(jwt, 'others')` or updating any user's metadata.
   *
   * Returns null when the service role key is not configured (e.g. local dev
   * without it), so callers can degrade gracefully.
   */
  getAdminClient(): SupabaseClient | null {
    return this.adminClient;
  }
}
