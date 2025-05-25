import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationUser, User } from 'src/entities';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ConfigModule } from '@nestjs/config';
import { SupabaseModule } from 'src/supabase/supabase.module';
import { Supabase } from 'src/supabase/supabase';

@Module({
  imports: [
    ConfigModule,
    SupabaseModule,
    TypeOrmModule.forFeature([User, OrganizationUser]),
  ],
  controllers: [UsersController],
  providers: [UsersService, Supabase],
})
export class UsersModule {}
