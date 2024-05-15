import { Controller, Get, Param } from '@nestjs/common';
import { Song } from 'src/entities';
import { SongsService } from 'src/services';

@Controller('songs')
export class SongsController {
  constructor(private songsService: SongsService) {}

  @Get()
  async findAll(): Promise<Song[]> {
    return await this.songsService.findAll();
  }

  @Get(':id')
  async findOne(@Param() params: any): Promise<Song> {
    return await this.songsService.findOne(params.id);
  }

  @Get('search/:query')
  async search(@Param() params: any): Promise<Song[]> {
    return await this.songsService.search(params.query);
  }
}
