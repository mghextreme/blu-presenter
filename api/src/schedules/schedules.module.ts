import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Schedule, Song } from '../entities';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { UsersModule } from 'src/users/users.module';
import { SpotifyModule } from 'src/spotify/spotify.module';
import { YoutubeModule } from 'src/youtube/youtube.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Schedule, Song]),
    UsersModule,
    SpotifyModule,
    YoutubeModule,
  ],
  controllers: [SchedulesController],
  providers: [SchedulesService],
})
export class SchedulesModule {}
