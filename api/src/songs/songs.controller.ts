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
import { ApiTags, ApiBearerAuth, ApiHeader } from '@nestjs/swagger';
import { Song } from 'src/entities';
import { SearchSongDto, CopySongToOrganizationDto, CreateSongDto, UpdateSongDto } from 'src/types';
import { SongsService } from './songs.service';
import { OrganizationRole } from 'src/auth/organization-role.decorator';
import { SongWithRoleViewModel } from 'src/models/song-with-role.view-model';
import { Public } from 'src/supabase/public.decorator';

@Controller('songs')
@ApiTags('songs')
@ApiBearerAuth('JWT-auth')
@ApiHeader({
  name: 'Organization',
  description: 'Organization ID',
  required: false,
})
export class SongsController {
  constructor(
    private readonly songsService: SongsService,
  ) {}

  @Public()
  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Query('secret') secret?: string,
  ): Promise<SongWithRoleViewModel | null> {
    return await this.songsService.findOneInAnyOrgOrBySecret(id, secret);
  }

  @Post(['search', 'advancedSearch'])
  async search(
    @Body() advancedSearchDto: SearchSongDto,
  ): Promise<SongWithRoleViewModel[]> {
    return await this.songsService.advancedSearch(advancedSearchDto);
  }

  @Post()
  @OrganizationRole('owner', 'admin', 'member')
  async create(
    @Headers('Organization') orgId: number,
    @Body() createSongDto: CreateSongDto,
  ): Promise<Song> {
    return await this.songsService.create(orgId, createSongDto);
  }

  @Post('copyToOrganization')
  @OrganizationRole('owner', 'admin', 'member', 'guest')
  async copyToOrganization(
    @Body() copySongDto: CopySongToOrganizationDto,
  ): Promise<void> {
    await this.songsService.copyToOrganization(copySongDto.songId, copySongDto.organizationId);
  }

  @Put(':id')
  @OrganizationRole('owner', 'admin', 'member')
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
