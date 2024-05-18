import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, Repository } from 'typeorm';
import { UpdateSongDto } from 'src/types';
import { Song, SongPart } from 'src/entities';

@Injectable()
export class SongsService {
  constructor(
    @InjectRepository(Song)
    private songsRepository: Repository<Song>,
  ) {}

  async findOne(id: number): Promise<Song | null> {
    return this.songsRepository.findOne({
      where: { id },
      relations: {
        blocks: true,
      },
    });
  }

  async findAll(): Promise<Song[]> {
    return this.songsRepository.find({
      order: {
        title: 'asc',
        artist: 'asc',
      },
    });
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

  async update(id: number, updateSongDto: UpdateSongDto): Promise<Song> {
    const song = await this.findOne(id);
    song.title = updateSongDto.title;
    song.artist = updateSongDto.artist;
    song.blocks = updateSongDto.blocks.map((block, ix) => {
      return {
        order: ix,
        text: block.text,
        songId: id,
      } as SongPart;
    });

    this.songsRepository.save(song).catch((err) => {
      console.log(err);
    });

    return {} as Song;
  }
}
