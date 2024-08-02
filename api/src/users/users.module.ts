import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Organization, User } from 'src/entities';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    TypeOrmModule.forFeature([Organization]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
})
export class UsersModule {}
