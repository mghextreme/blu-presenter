import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Schedule } from 'src/entities';
import {
  CreateScheduleDto,
  SearchScheduleDto,
  UpdateScheduleDto,
  CreateSchedulePlaylistDto,
  SchedulePlaylistSyncResult,
} from 'src/types';
import { ScheduleWithRoleViewModel } from 'src/models/schedule-with-role.view-model';
import { SchedulesService } from './schedules.service';
import { OrganizationRole } from 'src/auth/organization-role.decorator';
import { Public } from 'src/supabase/public.decorator';
import { SpotifyService } from 'src/spotify/spotify.service';
import { YoutubeService } from 'src/youtube/youtube.service';

@Controller('schedules')
export class SchedulesController {
  constructor(
    private readonly schedulesService: SchedulesService,
    private readonly spotifyService: SpotifyService,
    private readonly youtubeService: YoutubeService,
  ) {}

  @Post('search')
  async search(
    @Body() searchScheduleDto: SearchScheduleDto,
  ): Promise<ScheduleWithRoleViewModel[]> {
    return await this.schedulesService.search(searchScheduleDto);
  }

  @Public()
  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Query('secret') secret?: string,
  ): Promise<Schedule | null> {
    return await this.schedulesService.findOneInAnyOrgOrBySecret(id, secret);
  }

  @Post()
  @OrganizationRole('owner', 'admin', 'member')
  async create(
    @Headers('Organization') orgId: number,
    @Body() createScheduleDto: CreateScheduleDto,
  ): Promise<Schedule> {
    return await this.schedulesService.create(orgId, createScheduleDto);
  }

  @Put(':id')
  @OrganizationRole('owner', 'admin', 'member')
  async update(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
    return await this.schedulesService.update(orgId, id, updateScheduleDto);
  }

  @Delete(':id')
  @OrganizationRole('owner', 'admin', 'member')
  async delete(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.schedulesService.delete(orgId, id);
  }

  @Post(':id/spotify-playlist')
  @OrganizationRole('owner', 'admin', 'member')
  async syncSpotifyPlaylist(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
    @Body() dto: CreateSchedulePlaylistDto,
  ): Promise<SchedulePlaylistSyncResult> {
    return await this.spotifyService.syncSchedulePlaylist(orgId, id, dto);
  }

  @Delete(':id/spotify-playlist')
  @OrganizationRole('owner', 'admin', 'member')
  async removeSpotifyPlaylist(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.spotifyService.removeSchedulePlaylist(orgId, id);
  }

  @Post(':id/youtube-playlist')
  @OrganizationRole('owner', 'admin', 'member')
  async syncYoutubePlaylist(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
    @Body() dto: CreateSchedulePlaylistDto,
  ): Promise<SchedulePlaylistSyncResult> {
    return await this.youtubeService.syncSchedulePlaylist(orgId, id, dto);
  }

  @Delete(':id/youtube-playlist')
  @OrganizationRole('owner', 'admin', 'member')
  async removeYoutubePlaylist(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.youtubeService.removeSchedulePlaylist(orgId, id);
  }
}
