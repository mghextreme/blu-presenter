import { Module } from '@nestjs/common';
import { SessionsGateway } from './sessions.gateway';
import { SessionsService } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { BroadcastController } from './broadcast.controller';
import { BroadcastService } from './broadcast.service';
import { Session } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), UsersModule],
  controllers: [SessionsController, BroadcastController],
  providers: [SessionsService, SessionsGateway, BroadcastService],
  exports: [SessionsService],
})
export class SessionsModule {}
