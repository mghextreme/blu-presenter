import { Module } from '@nestjs/common';
import { SessionsGateway } from './sessions.gateway';
import {
  SessionsService,
  SessionsServiceWithRequest,
} from './sessions.service';
import { SessionsController } from './sessions.controller';
import { BroadcastController } from './broadcast.controller';
import { BroadcastService } from './broadcast.service';
import { Session } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  controllers: [SessionsController, BroadcastController],
  providers: [
    SessionsService,
    SessionsServiceWithRequest,
    SessionsGateway,
    BroadcastService,
  ],
  exports: [SessionsService, SessionsServiceWithRequest],
})
export class SessionsModule {}
