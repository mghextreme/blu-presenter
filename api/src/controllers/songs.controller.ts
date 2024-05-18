import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { Song } from 'src/entities';
import { SongsService } from 'src/services';
import { UpdateSongDto } from 'src/types';

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

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateSongDto: UpdateSongDto,
  ): Promise<Song> {
    return await this.songsService.update(id, updateSongDto);
  }

  @Get('search/:query')
  async search(@Param('query') query: string): Promise<Song[]> {
    return await this.songsService.search(query);
  }
}
