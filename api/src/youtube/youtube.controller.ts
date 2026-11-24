import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import {
  PlaylistConnectCallbackDto,
  PlaylistConnectionStatus,
} from 'src/types';
import { YoutubeService } from './youtube.service';

@Controller('youtube')
@ApiTags('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('status')
  async getStatus(): Promise<PlaylistConnectionStatus> {
    return this.youtubeService.getStatus();
  }

  @Get('connect')
  async getConnectUrl(): Promise<{ url: string }> {
    return this.youtubeService.getConnectUrl();
  }

  @Post('connect')
  async completeConnect(
    @Body() dto: PlaylistConnectCallbackDto,
  ): Promise<PlaylistConnectionStatus> {
    return this.youtubeService.completeConnect(dto.code, dto.state);
  }

  @Delete('connect')
  async disconnect(): Promise<PlaylistConnectionStatus> {
    return this.youtubeService.disconnect();
  }
}
