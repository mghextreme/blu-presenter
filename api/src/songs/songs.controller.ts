import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Song } from 'src/entities';
import { CreateSongDto, UpdateSongDto } from 'src/types';
import { SongsService } from './songs.service';
import { OrganizationRole } from 'src/auth/organization-role.decorator';

@Controller('songs')
export class SongsController {
  constructor(private songsService: SongsService) {}

  @Get()
  @OrganizationRole('owner', 'admin', 'member')
  async findAll(@Headers('Organization') orgId: number): Promise<Song[]> {
    return await this.songsService.findAll(orgId);
  }

  @Get(':id')
  @OrganizationRole('owner', 'admin', 'member')
  async findOne(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
  ): Promise<Song> {
    return await this.songsService.findOne(orgId, id);
  }

  @Get('search/:query')
  @OrganizationRole('owner', 'admin', 'member')
  async search(
    @Headers('Organization') orgId: number,
    @Param('query') query: string,
  ): Promise<Song[]> {
    return await this.songsService.search(orgId, query);
  }

  @Post()
  @OrganizationRole('owner', 'admin')
  async create(
    @Headers('Organization') orgId: number,
    @Body() createSongDto: CreateSongDto,
  ): Promise<Song> {
    return await this.songsService.create(orgId, createSongDto);
  }

  @Put(':id')
  @OrganizationRole('owner', 'admin')
  async update(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
    @Body() updateSongDto: UpdateSongDto,
  ): Promise<Song> {
    return await this.songsService.update(orgId, id, updateSongDto);
  }

  @Delete(':id')
  @OrganizationRole('owner', 'admin')
  async delete(
    @Headers('Organization') orgId: number,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.songsService.delete(orgId, id);
  }
}
