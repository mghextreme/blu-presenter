import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, IsNull, Or, Repository } from 'typeorm';
import { CreateScheduleDto, IScheduleItem, OrganizationRoleOptions, UpdateScheduleDto } from 'src/types';
import { Schedule, Song } from 'src/entities';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';
import { generateRandomSecret } from 'src/utils/secret';
import { UsersService } from 'src/users/users.service';

type ScheduleWithRole = Schedule & {
  organization?: {
    id: number;
    name: string;
    role?: OrganizationRoleOptions;
  };
};

@Injectable({ scope: Scope.REQUEST })
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly schedulesRepository: Repository<Schedule>,
    @InjectRepository(Song)
    private readonly songsRepository: Repository<Song>,
    @Inject(UsersService)
    private readonly usersService: UsersService,
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
        secret: true,
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
        secret: true,
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

  async findOneInAnyOrgOrBySecret(id: number, secret?: string): Promise<ScheduleWithRole | null> {
    let whereClause: any = { id };

    let userOrgs: any[] = [];
    let userOrgIds: number[] = [];

    if (!!this.request.user) {
      const user = this.request.user['internal'];
      userOrgs = await this.usersService.findUserOrganizations(user.id);
      userOrgIds = userOrgs.map((org) => org.organization.id);

      whereClause.orgId = Or(In(userOrgIds), IsNull());

      if (secret) {
        whereClause = [whereClause, { id, secret }];
      }
    } else {
      whereClause.secret = secret ?? IsNull();
    }

    const schedule = await this.schedulesRepository.findOne({
      select: {
        id: true,
        orgId: true,
        title: true,
        date: true,
        items: true,
        secret: true,
        organization: {
          id: true,
          name: true,
        },
      },
      where: whereClause,
      relations: {
        organization: true,
      },
    });

    if (!schedule) {
      return null;
    }

    if (schedule.items?.length) {
      schedule.items = await this.resolveSongReferences(schedule.items);
    }

    const orgUser = userOrgs.find((org) => org.organization.id === schedule.orgId);

    return {
      ...schedule,
      organization: orgUser
        ? {
            ...orgUser.organization,
            role: orgUser.role as OrganizationRoleOptions,
          }
        : {
            ...schedule.organization,
            role: undefined,
          },
    } as ScheduleWithRole;
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
        'song.updatedAt',
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
          updatedAt: song.updatedAt,
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
      secret: generateRandomSecret(10),
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
