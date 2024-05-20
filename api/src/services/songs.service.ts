import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Equal, ILike, In, Not, Repository } from 'typeorm';
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
    let result: Song;

    await this.dataSource.transaction(async (manager) => {
      const songsRepository = manager.getRepository(Song);

      const song = await songsRepository.findOneBy({ id });
      song.title = updateSongDto.title;
      song.artist = updateSongDto.artist;
      result = await this.songsRepository.save(song);

      const songPartRepository = manager.getRepository(SongPart);
      songPartRepository.delete({
        songId: Equal(song.id),
        id: Not(In(updateSongDto.blocks.map((b) => b.id).filter((b) => b))),
      });

      await manager
        .createQueryBuilder()
        .insert()
        .into(SongPart, ['id', 'order', 'text', 'songId'])
        .values(
          updateSongDto.blocks.map((b, ix) => {
            return {
              id: b.id,
              order: ix,
              text: b.text,
              songId: song.id,
            } as SongPart;
          }),
        )
        .orUpdate(['text', 'order'], ['id'])
        .execute();

      return result;
    });

    return result as Song;
  }

  async delete(id: number): Promise<void> {
    await this.songsRepository.delete(id);
  }
}
