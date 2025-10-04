import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OrganizationUser, User } from 'src/entities';
import { UsersService, UsersBaseService } from './users.service';
import { UsersController } from './users.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User, OrganizationUser]),
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersBaseService],
  exports: [UsersService, UsersBaseService],
})
export class UsersModule {}
