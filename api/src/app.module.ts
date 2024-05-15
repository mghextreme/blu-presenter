import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import configuration from './config/configuration';
import { DatabaseConfigService, SongsService } from './services';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SongsModule } from './modules';
import { SongsController } from './controllers';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../.env',
      load: [configuration],
    }),
    TypeOrmModule.forRootAsync({
      useClass: DatabaseConfigService,
    }),
    SongsModule,
  ],
  controllers: [AppController, SongsController],
  providers: [SongsService],
})
export class AppModule {}
