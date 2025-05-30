import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Organization,
  OrganizationUser,
  OrganizationInvitation,
  User,
} from '../entities';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { OrganizationsModule } from 'src/organizations/organizations.module';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
    OrganizationsModule,
    TypeOrmModule.forFeature([
      Organization,
      OrganizationUser,
      OrganizationInvitation,
      User,
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, OrganizationsService],
  exports: [AuthService, OrganizationsService],
})
export class AuthModule {}
