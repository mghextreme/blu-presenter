import { Module } from '@nestjs/common';
import { SessionsGateway } from './sessions.gateway';
import { SessionsService, SessionsServiceWithRequest } from './sessions.service';
import { SessionsController } from './sessions.controller';
import { Session } from 'src/entities';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session]),
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('auth.jwtSecret'),
        signOptions: { expiresIn: '300s' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [SessionsController],
  providers: [SessionsService, SessionsServiceWithRequest, SessionsGateway],
  exports: [SessionsService, SessionsServiceWithRequest],
})
export class SessionsModule {}
