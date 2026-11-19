import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SpotifyConnectCallbackDto, SpotifyConnectionStatus } from 'src/types';
import { SpotifyService } from './spotify.service';

@Controller('spotify')
@ApiTags('spotify')
export class SpotifyController {
  constructor(private readonly spotifyService: SpotifyService) {}

  @Get('status')
  async getStatus(): Promise<SpotifyConnectionStatus> {
    return this.spotifyService.getStatus();
  }

  @Get('connect')
  async getConnectUrl(): Promise<{ url: string }> {
    return this.spotifyService.getConnectUrl();
  }

  @Post('connect')
  async completeConnect(
    @Body() dto: SpotifyConnectCallbackDto,
  ): Promise<SpotifyConnectionStatus> {
    return this.spotifyService.completeConnect(dto.code, dto.state);
  }

  @Delete('connect')
  async disconnect(): Promise<SpotifyConnectionStatus> {
    return this.spotifyService.disconnect();
  }
}
