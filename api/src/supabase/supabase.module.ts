import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SupabaseStrategy } from './supabase.strategy';
import { SupabaseGuard } from './supabase.guard';
import { Supabase } from './supabase';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Organization,
  OrganizationInvitation,
  OrganizationUser,
  User,
} from 'src/entities';

@Global()
@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([
      User,
      Organization,
      OrganizationUser,
      OrganizationInvitation,
    ]),
  ],
  providers: [
    Supabase,
    SupabaseStrategy,
    SupabaseGuard,
    UsersService,
    OrganizationsService,
  ],
  exports: [
    Supabase,
    SupabaseStrategy,
    SupabaseGuard,
    UsersService,
    OrganizationsService,
  ],
})
export class SupabaseModule {}
