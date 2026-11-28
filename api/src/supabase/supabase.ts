import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { fetchWithTimeout } from 'src/utils/fetch-with-timeout';

@Injectable()
export class Supabase {
  // Created on construction so singletons can take it in their own
  // constructors.
  private readonly client: SupabaseClient;

  constructor(configService: ConfigService) {
    this.client = createClient(
      configService.getOrThrow<string>('supabase.url'),
      configService.getOrThrow<string>('supabase.key'),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false,
        },
        global: {
          fetch: (input, init) => fetchWithTimeout(input, init),
        },
      },
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
