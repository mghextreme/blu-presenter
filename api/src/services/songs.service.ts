import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { Song } from '../entities';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private songsRepository: Repository<Song>,
  ) {}

  async findOne(id: number): Promise<Song | null> {
    return this.songsRepository.findOneBy({ id });
  }

  async search(query: string): Promise<Song[]> {
    return this.songsRepository.find({
      where: [
        { title: ILike(`%${query}%`) },
        { blocks: { text: ILike(`%${query}%`) } },
      ],
    });
  }
}
