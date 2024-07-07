import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, ILike, Repository } from 'typeorm';
import { CreateSongDto, UpdateSongDto } from 'src/types';
import { Song, SongPart } from 'src/entities';

@Injectable()
export class SongsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Song) private songsRepository: Repository<Song>,
  ) {}

  async findOne(id: number): Promise<Song | null> {
    return this.songsRepository.findOne({
      select: {
        id: true,
        title: true,
        artist: true,
        blocks: true,
      },
      where: { id },
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
    return await this.songsRepository.find({
      where: [
        { title: ILike(`%${query}%`) },
        { artist: ILike(`%${query}%`) },
        // TODO: search within song text
        // { blocks: { text: ILike(`%${query}%`) } },
      ],
      select: {
        id: true,
        title: true,
        artist: true,
        blocks: true,
      },
      order: {
        title: 'asc',
      },
    });
  }

  async create(createSongDto: CreateSongDto): Promise<Song> {
    let songId: number;

    await this.dataSource.transaction(async (manager) => {
      const songsRepository = manager.getRepository(Song);

      const result = await songsRepository.insert({
        title: createSongDto.title,
        artist: createSongDto.artist,
      });
      songId = result.raw[0].id;

      const songPartRepository = manager.getRepository(SongPart);
      await songPartRepository.insert(
        createSongDto.blocks.map((b, ix) => {
          return {
            order: ix,
            text: b.text,
            songId: songId,
          } as SongPart;
        }),
      );
    });

    return this.findOne(songId);
  }

  async update(id: number, updateSongDto: UpdateSongDto): Promise<Song> {
    const song = await this.songsRepository.findOneBy({ id });
    song.title = updateSongDto.title;
    song.artist = updateSongDto.artist;
    song.blocks = updateSongDto.blocks;

    const result = await this.songsRepository.save(song);
    return result as Song;
  }

  async delete(id: number): Promise<void> {
    await this.songsRepository.delete(id);
  }
}
