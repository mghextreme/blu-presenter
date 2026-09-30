import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Song, SongVcsFile, VcsSource, VcsSyncRun } from '../entities';
import { GitHubClient } from './github.client';
import { VCS_CLIENT } from './vcs-client.provider';
import { PathFilterService } from './path-filter.service';
import { SongTextFormatService } from 'src/songs/text-format/song-text-format.service';
import { VcsSourcesService } from './vcs-sources.service';
import { VcsSyncService } from './vcs-sync.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Song, VcsSource, SongVcsFile, VcsSyncRun]),
  ],
  providers: [
    PathFilterService,
    VcsSourcesService,
    VcsSyncService,
    SongTextFormatService,
    { provide: VCS_CLIENT, useClass: GitHubClient },
  ],
  exports: [VcsSourcesService, VcsSyncService],
})
export class VcsSyncModule {}
