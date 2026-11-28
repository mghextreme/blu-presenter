import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SupabaseStrategy } from './supabase.strategy';
import { Supabase } from './supabase';

@Global()
@Module({
  imports: [ConfigModule],
  providers: [Supabase, SupabaseStrategy],
  exports: [Supabase],
})
export class SupabaseModule {}
