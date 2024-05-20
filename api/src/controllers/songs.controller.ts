import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';
import { Song } from 'src/entities';
import { SongsService } from 'src/services';
import { CreateSongDto, UpdateSongDto } from 'src/types';

@Controller('songs')
export class SongsController {
  constructor(private songsService: SongsService) {}

  @Get()
  async findAll(): Promise<Song[]> {
    return await this.songsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<Song> {
    return await this.songsService.findOne(id);
  }

  @Get('search/:query')
  async search(@Param('query') query: string): Promise<Song[]> {
    return await this.songsService.search(query);
  }

  @Post()
  async create(@Body() createSongDto: CreateSongDto): Promise<Song> {
    return await this.songsService.create(createSongDto);
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateSongDto: UpdateSongDto,
  ): Promise<Song> {
    return await this.songsService.update(id, updateSongDto);
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<void> {
    return await this.songsService.delete(id);
  }
}
