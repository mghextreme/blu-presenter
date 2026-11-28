import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song } from '../entities';
import { SongsController } from './songs.controller';
import { SongsService } from './songs.service';
import { SongTextFormatService } from './text-format/song-text-format.service';
import { UsersModule } from 'src/users/users.module';

@Module({
  imports: [TypeOrmModule.forFeature([Song]), UsersModule],
  controllers: [SongsController],
  providers: [SongsService, SongTextFormatService],
})
export class SongsModule {}
