import { Body, Controller, Delete, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/entities';
import { CurrentUser } from 'src/auth/request-context.decorator';
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
  async getStatus(
    @CurrentUser() user: User,
  ): Promise<PlaylistConnectionStatus> {
    return this.youtubeService.getStatus(user);
  }

  @Get('connect')
  async getConnectUrl(@CurrentUser() user: User): Promise<{ url: string }> {
    return this.youtubeService.getConnectUrl(user);
  }

  @Post('connect')
  async completeConnect(
    @CurrentUser() user: User,
    @Body() dto: PlaylistConnectCallbackDto,
  ): Promise<PlaylistConnectionStatus> {
    return this.youtubeService.completeConnect(user, dto.code, dto.state);
  }

  @Delete('connect')
  async disconnect(
    @CurrentUser() user: User,
  ): Promise<PlaylistConnectionStatus> {
    return this.youtubeService.disconnect(user);
  }
}
