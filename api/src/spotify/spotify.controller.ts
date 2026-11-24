import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
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
  async getStatus(): Promise<PlaylistConnectionStatus> {
    return this.spotifyService.getStatus();
  }

  @Get('connect')
  async getConnectUrl(): Promise<{ url: string }> {
    return this.spotifyService.getConnectUrl();
  }

  @Post('connect')
  async completeConnect(
    @Body() dto: PlaylistConnectCallbackDto,
  ): Promise<PlaylistConnectionStatus> {
    return this.spotifyService.completeConnect(dto.code, dto.state);
  }

  @Delete('connect')
  async disconnect(): Promise<PlaylistConnectionStatus> {
    return this.spotifyService.disconnect();
  }
}
