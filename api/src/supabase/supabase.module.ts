import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { SupabaseStrategy } from './supabase.strategy';
import { SupabaseGuard } from './supabase.guard';
import { Supabase } from './supabase';
import { UsersService, UsersBaseService } from '../users/users.service';
import { OrganizationsService, OrganizationsBaseService } from '../organizations/organizations.service';
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
    UsersBaseService,
    OrganizationsService,
    OrganizationsBaseService,
  ],
  exports: [
    Supabase,
    SupabaseStrategy,
    SupabaseGuard,
    UsersService,
    UsersBaseService,
    OrganizationsService,
    OrganizationsBaseService,
  ],
})
export class SupabaseModule {}
