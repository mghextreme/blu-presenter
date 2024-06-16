import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  Equal,
  ILike,
  In,
  InsertResult,
  Not,
  Repository,
  UpdateResult,
} from 'typeorm';
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
      order: {
        blocks: {
          order: 'asc',
        },
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

    const idsList = idsFound.map((x) => x.id);

    return await this.songsRepository.find({
      where: {
        id: In(idsList),
      },
      relations: {
        blocks: true,
      },
      order: {
        title: 'asc',
        blocks: {
          order: 'asc',
        },
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
    let result: Song;

    await this.dataSource.transaction(async (manager) => {
      const songsRepository = manager.getRepository(Song);

      const song = await songsRepository.findOneBy({ id });
      song.title = updateSongDto.title;
      song.artist = updateSongDto.artist;
      result = await this.songsRepository.save(song);

      const songPartRepository = manager.getRepository(SongPart);
      await songPartRepository.delete({
        songId: Equal(song.id),
        id: Not(In(updateSongDto.blocks.map((b) => b.id).filter((b) => b))),
      });

      const partsToAdd = [];
      const partsToUpdate = [];

      updateSongDto.blocks.forEach((b, ix) => {
        const part = {
          id: b.id,
          order: ix,
          text: b.text,
          songId: song.id,
        } as SongPart;

        if (part.id) {
          partsToUpdate.push(part);
        } else {
          partsToAdd.push(part);
        }
      });

      const promises: Promise<InsertResult | UpdateResult>[] = [];
      partsToUpdate.forEach((sp) => {
        promises.push(
          songPartRepository.update(
            {
              id: sp.id,
            },
            sp,
          ),
        );
      });
      promises.push(songPartRepository.insert(partsToAdd));

      await Promise.all(promises);

      return result;
    });

    return result as Song;
  }

  async delete(id: number): Promise<void> {
    await this.songsRepository.delete(id);
  }
}
