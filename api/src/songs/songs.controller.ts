import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Put,
  Query,
  Res,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiHeader,
  ApiProduces,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Song } from 'src/entities';
import {
  SearchSongDto,
  CopySongToOrganizationDto,
  CreateSongDto,
  ImportSongTextDto,
  UpdateSongDto,
} from 'src/types';
import { SongsService } from './songs.service';
import { SongTextFormatService } from './text-format/song-text-format.service';
import { OrganizationRole } from 'src/auth/organization-role.decorator';
import { SongWithRoleViewModel } from 'src/models/song-with-role.view-model';
import { Public } from 'src/supabase/public.decorator';
import { slugify } from 'src/utils/slug';

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
    private readonly songTextFormat: SongTextFormatService,
  ) {}

  @Public()
  @Get(':id')
  async findOne(
    @Param('id') id: number,
    @Query('secret') secret?: string,
  ): Promise<SongWithRoleViewModel | null> {
    return await this.songsService.findOneInAnyOrgOrBySecret(id, secret);
  }

  @Public()
  @Get(':id/export')
  @ApiProduces('text/markdown')
  async export(
    @Param('id') id: number,
    @Res() res: Response,
    @Query('secret') secret?: string,
  ): Promise<void> {
    const song = await this.songsService.findOneInAnyOrgOrBySecret(id, secret);
    if (!song) {
      throw new NotFoundException();
    }

    const filename = `${slugify(`${song.artist}-${song.title}`) || `song-${song.id}`}.md`;
    res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(filename)}`,
    );
    res.send(this.songTextFormat.encode(song));
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

  @Post('importText')
  @OrganizationRole('owner', 'admin', 'member')
  async importText(
    @Headers('Organization') orgId: number,
    @Body() importTextDto: ImportSongTextDto,
  ): Promise<Song> {
    return await this.songsService.importText(orgId, importTextDto.text);
  }

  @Post('copyToOrganization')
  @OrganizationRole('owner', 'admin', 'member', 'guest')
  async copyToOrganization(
    @Body() copySongDto: CopySongToOrganizationDto,
  ): Promise<void> {
    await this.songsService.copyToOrganization(
      copySongDto.songId,
      copySongDto.organizationId,
    );
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
