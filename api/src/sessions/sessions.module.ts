import { Module } from '@nestjs/common';
import { SessionsGateway } from './sessions.gateway';
import { SessionsService, SessionsServiceWithRequest } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { Session } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session]),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsServiceWithRequest, SessionsGateway],
  exports: [SessionsService, SessionsServiceWithRequest],
})
export class SessionsModule {}
