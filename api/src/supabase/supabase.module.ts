import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SupabaseStrategy } from './supabase.strategy';
import { SupabaseGuard } from './supabase.guard';
import { Supabase } from './supabase';
import { UsersService } from 'src/users/users.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/entities';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([User])],
  providers: [Supabase, SupabaseStrategy, SupabaseGuard, UsersService],
  exports: [Supabase, SupabaseStrategy, SupabaseGuard, UsersService],
})
export class SupabaseModule {}
