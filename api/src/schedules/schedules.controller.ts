import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { Schedule, User } from 'src/entities';
import {
  CreateScheduleDto,
  OrganizationRoleOptions,
  SearchScheduleDto,
  UpdateScheduleDto,
  CreateSchedulePlaylistDto,
  SchedulePlaylistSyncResult,
} from 'src/types';
import { SchedulesService, ScheduleWithRole } from './schedules.service';
import { OrganizationRole } from 'src/auth/organization-role.decorator';
import {
  CurrentUser,
  OptionalUser,
  OrgId,
  OrgRole,
} from 'src/auth/request-context.decorator';
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
    @CurrentUser() user: User,
    @Body() searchScheduleDto: SearchScheduleDto,
  ): Promise<ScheduleWithRole[]> {
    return await this.schedulesService.search(searchScheduleDto, user);
  }

  @Public()
  @Get(':id')
  async findOne(
    @OptionalUser() user: User | undefined,
    @Param('id') id: number,
    @Query('secret') secret?: string,
  ): Promise<ScheduleWithRole | null> {
    return await this.schedulesService.findOneInAnyOrgOrBySecret(
      id,
      secret,
      user,
    );
  }

  @Post()
  @OrganizationRole('owner', 'admin', 'member')
  async create(
    @OrgId() orgId: number,
    @CurrentUser() user: User,
    @Body() createScheduleDto: CreateScheduleDto,
  ): Promise<Schedule | null> {
    return await this.schedulesService.create(orgId, createScheduleDto, user);
  }

  @Put(':id')
  @OrganizationRole('owner', 'admin', 'member')
  async update(
    @OrgId() orgId: number,
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body() updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
    return await this.schedulesService.update(
      orgId,
      id,
      updateScheduleDto,
      user,
    );
  }

  @Delete(':id')
  @OrganizationRole('owner', 'admin', 'member')
  async delete(
    @OrgId() orgId: number,
    @OrgRole() role: OrganizationRoleOptions,
    @CurrentUser() user: User,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.schedulesService.delete(orgId, id, user, role);
  }

  @Post(':id/spotify-playlist')
  @OrganizationRole('owner', 'admin', 'member')
  async syncSpotifyPlaylist(
    @OrgId() orgId: number,
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body() dto: CreateSchedulePlaylistDto,
  ): Promise<SchedulePlaylistSyncResult> {
    return await this.spotifyService.syncSchedulePlaylist(user, orgId, id, dto);
  }

  @Delete(':id/spotify-playlist')
  @OrganizationRole('owner', 'admin', 'member')
  async removeSpotifyPlaylist(
    @OrgId() orgId: number,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.spotifyService.removeSchedulePlaylist(orgId, id);
  }

  @Post(':id/youtube-playlist')
  @OrganizationRole('owner', 'admin', 'member')
  async syncYoutubePlaylist(
    @OrgId() orgId: number,
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body() dto: CreateSchedulePlaylistDto,
  ): Promise<SchedulePlaylistSyncResult> {
    return await this.youtubeService.syncSchedulePlaylist(user, orgId, id, dto);
  }

  @Delete(':id/youtube-playlist')
  @OrganizationRole('owner', 'admin', 'member')
  async removeYoutubePlaylist(
    @OrgId() orgId: number,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.youtubeService.removeSchedulePlaylist(orgId, id);
  }
}
