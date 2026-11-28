import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/entities';
import { CurrentUser } from 'src/auth/request-context.decorator';
import {
  PlaylistConnectCallbackDto,
  PlaylistConnectionStatus,
} from 'src/types';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
@ApiTags('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('status')
  async getStatus(
    @CurrentUser() user: User,
  ): Promise<PlaylistConnectionStatus> {
    return this.spotifyService.getStatus(user);
  }

  @Get('connect')
  async getConnectUrl(@CurrentUser() user: User): Promise<{ url: string }> {
    return this.spotifyService.getConnectUrl(user);
  }

  @Post('connect')
  async completeConnect(
    @CurrentUser() user: User,
    @Body() dto: PlaylistConnectCallbackDto,
  ): Promise<PlaylistConnectionStatus> {
    return this.spotifyService.completeConnect(user, dto.code, dto.state);
  }

  @Delete('connect')
  async disconnect(
    @CurrentUser() user: User,
  ): Promise<PlaylistConnectionStatus> {
    return this.spotifyService.disconnect(user);
  }
}
