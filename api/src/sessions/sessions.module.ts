import { Module } from '@nestjs/common';
import { SessionsGateway } from './sessions.gateway';
import { SessionsService, SessionsServiceWithRequest } from './sessions.service';
import { Session } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([Session])],
  providers: [SessionsService, SessionsServiceWithRequest, SessionsGateway],
})
export class SessionsModule {}
