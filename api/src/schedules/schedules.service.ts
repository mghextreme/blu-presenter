import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateScheduleDto, IScheduleItem, UpdateScheduleDto } from 'src/types';
import { Schedule, Song } from 'src/entities';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly schedulesRepository: Repository<Schedule>,
    @InjectRepository(Song)
    private readonly songsRepository: Repository<Song>,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {}

  async findAll(orgId: number): Promise<Schedule[]> {
    return this.schedulesRepository.find({
      select: {
        id: true,
        title: true,
        date: true,
        items: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        orgId,
      },
      order: {
        createdAt: 'DESC',
      },
    });
  }

  async findOne(orgId: number, id: number): Promise<Schedule | null> {
    const schedule = await this.schedulesRepository.findOne({
      select: {
        id: true,
        title: true,
        date: true,
        items: true,
        createdBy: true,
        updatedBy: true,
        createdAt: true,
        updatedAt: true,
      },
      where: {
        id,
        orgId,
      },
    });

    if (!schedule || !schedule.items?.length) {
      return schedule;
    }

    schedule.items = await this.resolveSongReferences(schedule.items);
    return schedule;
  }

  private async resolveSongReferences(items: IScheduleItem[]): Promise<IScheduleItem[]> {
    const songItems = items.filter((item) => item.type === 'song');
    if (songItems.length === 0) {
      return items;
    }

    const songIds = [...new Set(songItems.map((item) => item.id))];

    const songs = await this.songsRepository
      .createQueryBuilder('song')
      .select([
        'song.id',
        'song.title',
        'song.artist',
        'song.language',
        'song.blocks',
        'song.references',
        'song.secret',
      ])
      .where('song.id IN (:...songIds)', { songIds })
      .getMany();

    const songsMap = new Map(songs.map((song) => [song.id, song]));

    return items
      .map((item) => {
        if (item.type !== 'song') {
          return item;
        }

        const song = songsMap.get(item.id);
        if (!song) {
          return null;
        }

        return {
          ...item,
          title: song.title,
          artist: song.artist,
          language: song.language,
          blocks: song.blocks,
          references: song.references,
          secret: song.secret,
        };
      })
      .filter((item) => item !== null);
  }

  async create(orgId: number, createScheduleDto: CreateScheduleDto): Promise<Schedule> {
    if (this.request.user === undefined) {
      throw new UnauthorizedException();
    }

    const user = this.request.user['internal'];

    const result = await this.schedulesRepository.insert({
      title: createScheduleDto.title,
      date: createScheduleDto.date || null,
      items: createScheduleDto.items,
      orgId,
      createdBy: user.id,
    });

    const scheduleId = result.raw[0].id;
    return this.findOne(orgId, scheduleId);
  }

  async update(
    orgId: number,
    id: number,
    updateScheduleDto: UpdateScheduleDto,
  ): Promise<Schedule> {
    if (this.request.user === undefined) {
      throw new UnauthorizedException();
    }

    const schedule = await this.schedulesRepository.findOneBy({ id, orgId });
    if (!schedule) {
      throw new NotFoundException();
    }

    const user = this.request.user['internal'];

    if (updateScheduleDto.title !== undefined) {
      schedule.title = updateScheduleDto.title;
    }

    if (updateScheduleDto.date !== undefined) {
      schedule.date = updateScheduleDto.date || null;
    }

    if (updateScheduleDto.items !== undefined) {
      schedule.items = updateScheduleDto.items;
    }

    schedule.updatedBy = user.id;

    const result = await this.schedulesRepository.save(schedule);
    return result as Schedule;
  }

  async delete(orgId: number, id: number): Promise<void> {
    if (this.request.user === undefined) {
      throw new UnauthorizedException();
    }

    const schedule = await this.schedulesRepository.findOneBy({ id, orgId });
    if (!schedule) {
      throw new NotFoundException();
    }

    const user = this.request.user['internal'];
    const role = this.request.user['role'];

    // Admins and owners can always delete, members can only delete their own
    const isAdminOrOwner = role === 'owner' || role === 'admin';
    const isCreator = schedule.createdBy === user.id;

    if (!isAdminOrOwner && !isCreator) {
      throw new ForbiddenException('You can only delete schedules you created');
    }

    await this.schedulesRepository.delete(id);
  }
}
