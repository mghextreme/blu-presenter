import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Theme } from '../entities';
import { ThemesController } from './themes.controller';
import { ThemesService } from './themes.service';
import { SessionsModule } from 'src/sessions/sessions.module';

@Module({
  imports: [TypeOrmModule.forFeature([Theme]), SessionsModule],
  controllers: [ThemesController],
  providers: [ThemesService],
})
export class ThemesModule {}
