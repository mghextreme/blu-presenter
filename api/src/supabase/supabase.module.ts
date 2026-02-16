import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';

import { SupabaseStrategy } from './supabase.strategy';
import { SupabaseGuard } from './supabase.guard';
import { JwtVerificationService } from './jwt-verification.service';
import { Supabase } from './supabase';
import { UsersService, UsersBaseService } from '../users/users.service';
import { OrganizationsService, OrganizationsBaseService } from '../organizations/organizations.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
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
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.jwtSecret'),
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    Supabase,
    SupabaseStrategy,
    SupabaseGuard,
    JwtVerificationService,
    UsersService,
    UsersBaseService,
    OrganizationsService,
    OrganizationsBaseService,
  ],
  exports: [
    Supabase,
    SupabaseStrategy,
    SupabaseGuard,
    JwtVerificationService,
    UsersService,
    UsersBaseService,
    OrganizationsService,
    OrganizationsBaseService,
  ],
})
export class SupabaseModule {}
