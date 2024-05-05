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
    const idsFound = await this.songsRepository.find({
      where: [
        { title: ILike(`%${query}%`) },
        { blocks: { text: ILike(`%${query}%`) } },
      ],
      select: {
        id: true,
      },
    });

    if (idsFound.length == 0) return [];

    return await this.songsRepository
      .createQueryBuilder('songs')
      .innerJoinAndSelect('songs.blocks', 'parts')
      .where('songs.id IN (:idsFound)', { idsFound: idsFound.map((x) => x.id) })
      .orderBy('songs.title')
      .getMany();
  }
}
