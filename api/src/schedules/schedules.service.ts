import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, In, IsNull, Or, Repository } from 'typeorm';
import {
  CreateScheduleDto,
  IScheduleItem,
  isFeatureEnabled,
  OrganizationMembership,
  OrganizationRoleOptions,
  SearchScheduleDto,
  UpdateScheduleDto,
} from 'src/types';
import { Schedule, Song, User } from 'src/entities';
import { generateRandomSecret } from 'src/utils/secret';
import {
  mergeScheduleReferences,
  presentScheduleReferences,
} from 'src/utils/schedule-references';
import { UsersService } from 'src/users/users.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import {
  membershipOrgIds,
  WithOrganizationRole,
  withOrganizationRole,
} from 'src/utils/organization-membership';

export type ScheduleWithRole = WithOrganizationRole<Schedule>;

@Injectable()
export class SchedulesService {
  constructor(
    @InjectRepository(Schedule)
    private readonly schedulesRepository: Repository<Schedule>,
    @InjectRepository(Song)
    private readonly songsRepository: Repository<Song>,
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
  ) {}

  async search(
    searchDto: SearchScheduleDto,
    user: User,
  ): Promise<ScheduleWithRole[]> {
    const userOrgs = await this.usersService.findUserOrganizations(user.id);
    const userOrgIds = membershipOrgIds(userOrgs);

    // Any membership role (including guests) may list schedules, mirroring the
    // role policy of the previous per-org list endpoint.
    let orgIds: number[];
    if (searchDto.organizations && searchDto.organizations.length > 0) {
      if (
        !searchDto.organizations.every((id: number) => userOrgIds.includes(id))
      ) {
        throw new ForbiddenException(
          "You selected an organization which you don't have permissions to access.",
        );
      }

      orgIds = searchDto.organizations;
    } else {
      orgIds = userOrgIds;
    }

    // Exclude organizations which disabled the schedules feature
    const orgFeaturesById = new Map(
      userOrgs.map((org) => [
        org.organization.id,
        org.organization.disabledFeatures,
      ]),
    );
    orgIds = orgIds.filter((orgId) =>
      isFeatureEnabled(orgFeaturesById.get(orgId), 'schedules'),
    );

    if (orgIds.length === 0) {
      return [];
    }

    const pageSize = searchDto.itemsPerPage ?? 20;
    const page = searchDto.page ?? 1;

    if (
      searchDto.dateFrom &&
      searchDto.dateTo &&
      searchDto.dateFrom > searchDto.dateTo
    ) {
      throw new BadRequestException(
        'dateFrom must be earlier than or equal to dateTo',
      );
    }

    const queryBuilder = this.schedulesRepository
      .createQueryBuilder('schedule')
      .select([
        'schedule.id',
        'schedule.orgId',
        'schedule.title',
        'schedule.date',
        'schedule.secret',
        'schedule.createdBy',
        'schedule.createdAt',
        'schedule.updatedAt',
        'organization.id',
        'organization.name',
      ])
      .leftJoin('schedule.organization', 'organization')
      .where('"schedule"."orgId" IN (:...orgIds)', { orgIds });

    // The sort key is selected under an alias because ORDER BY expressions
    // cannot reference raw SQL when the query is paginated and joined
    // (TypeORM then applies ordering through a "distinctAlias" subquery,
    // which only accepts entity property paths or select aliases). The
    // alias is lowercase so Postgres resolves it case-insensitively in the
    // non-paginated path too.
    queryBuilder.addSelect(
      'COALESCE("schedule"."date", CAST("schedule"."createdAt" AS DATE))',
      'date_sort',
    );

    if (searchDto.query) {
      queryBuilder.andWhere('"schedule"."title" ILIKE :query', {
        query: `%${searchDto.query}%`,
      });
    }

    if (searchDto.dateFrom) {
      queryBuilder.andWhere('"schedule"."date" >= :dateFrom', {
        dateFrom: searchDto.dateFrom,
      });
    }

    if (searchDto.dateTo) {
      queryBuilder.andWhere('"schedule"."date" <= :dateTo', {
        dateTo: searchDto.dateTo,
      });
    }

    // Sort by the schedule date, falling back to the creation date when the
    // schedule has no date set.
    const schedules = await queryBuilder
      .orderBy('date_sort', 'DESC')
      .addOrderBy('schedule.id', 'DESC')
      .skip(pageSize * (page - 1))
      .take(pageSize)
      .getMany();

    return schedules.map((schedule) =>
      withOrganizationRole(schedule, userOrgs),
    );
  }

  /** `userId` decides which auto references are marked as created by the caller. */
  async findOne(
    orgId: number,
    id: number,
    userId: number,
  ): Promise<Schedule | null> {
    const schedule = await this.schedulesRepository.findOne({
      select: {
        id: true,
        title: true,
        date: true,
        items: true,
        references: true,
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
      relations: {
        organization: true,
      },
    });

    if (!schedule || !schedule.items?.length) {
      return schedule;
    }

    schedule.items = await this.resolveSongReferences(schedule.items);
    this.annotateReferences(schedule, userId);
    return schedule;
  }

  async findOneInAnyOrgOrBySecret(
    id: number,
    secret: string | undefined,
    user: User | undefined,
  ): Promise<ScheduleWithRole | null> {
    let whereClause: FindOptionsWhere<Schedule> | FindOptionsWhere<Schedule>[];

    let userOrgs: OrganizationMembership[] = [];

    if (user) {
      userOrgs = await this.usersService.findUserOrganizations(user.id);
      const inUserOrgsOrPublic: FindOptionsWhere<Schedule> = {
        id,
        orgId: Or(In(membershipOrgIds(userOrgs)), IsNull()),
      };
      whereClause = secret
        ? [inUserOrgsOrPublic, { id, secret }]
        : inUserOrgsOrPublic;
    } else {
      whereClause = { id, secret: secret ?? IsNull() };
    }

    const schedule = await this.schedulesRepository.findOne({
      select: {
        id: true,
        orgId: true,
        title: true,
        date: true,
        items: true,
        references: true,
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

    if (schedule.orgId != null) {
      const featureEnabled =
        await this.organizationsService.isFeatureEnabledInOrg(
          schedule.orgId,
          'schedules',
        );
      if (!featureEnabled) {
        if (user) {
          throw new ForbiddenException(
            'Schedules are disabled for this organization',
          );
        }
        throw new NotFoundException('Schedule not found');
      }
    }

    if (schedule.items?.length) {
      schedule.items = await this.resolveSongReferences(schedule.items);
    }
    this.annotateReferences(schedule, user?.id);

    return withOrganizationRole(schedule, userOrgs);
  }

  /**
   * Shapes the references for the response: auto-generated references are
   * marked with whether the requesting user created them (so the UI knows
   * who may re-sync) and lose their internal owner id.
   */
  private annotateReferences(
    schedule: Schedule,
    userId: number | undefined,
  ): void {
    schedule.references = presentScheduleReferences(
      schedule.references,
      userId,
    );
  }

  private async resolveSongReferences(
    items: IScheduleItem[],
  ): Promise<IScheduleItem[]> {
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
      .leftJoin('song.organization', 'organization')
      .addSelect(['organization.id', 'organization.name'])
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
          organization: song.organization
            ? {
                id: song.organization.id,
                name: song.organization.name,
              }
            : null,
        };
      })
      .filter((item) => item !== null);
  }

  async create(
    orgId: number,
    createScheduleDto: CreateScheduleDto,
    user: User,
  ): Promise<Schedule | null> {
    await this.organizationsService.assertFeatureEnabled(orgId, 'schedules');

    const result = await this.schedulesRepository.insert({
      title: createScheduleDto.title,
      date: createScheduleDto.date || null,
      items: createScheduleDto.items as Schedule['items'],
      // A new schedule has no stored references: auto references can't be
      // created through this endpoint.
      references: mergeScheduleReferences(
        createScheduleDto.references ?? [],
        [],
      ),
      secret: generateRandomSecret(10),
      orgId,
      createdBy: user.id,
    });

    const scheduleId = result.raw[0].id;
    return this.findOne(orgId, scheduleId, user.id);
  }

  async update(
    orgId: number,
    id: number,
    updateScheduleDto: UpdateScheduleDto,
    user: User,
  ): Promise<Schedule> {
    await this.organizationsService.assertFeatureEnabled(orgId, 'schedules');

    const schedule = await this.schedulesRepository.findOneBy({ id, orgId });
    if (!schedule) {
      throw new NotFoundException();
    }

    if (updateScheduleDto.title !== undefined) {
      schedule.title = updateScheduleDto.title;
    }

    if (updateScheduleDto.date !== undefined) {
      schedule.date = updateScheduleDto.date || null;
    }

    if (updateScheduleDto.items !== undefined) {
      schedule.items = updateScheduleDto.items;
    }

    if (updateScheduleDto.references !== undefined) {
      schedule.references = mergeScheduleReferences(
        updateScheduleDto.references,
        schedule.references,
      );
    }

    schedule.updatedBy = user.id;

    const result = await this.schedulesRepository.save(schedule);
    this.annotateReferences(result, user.id);
    return result;
  }

  async delete(
    orgId: number,
    id: number,
    user: User,
    role: OrganizationRoleOptions,
  ): Promise<void> {
    await this.organizationsService.assertFeatureEnabled(orgId, 'schedules');

    const schedule = await this.schedulesRepository.findOneBy({ id, orgId });
    if (!schedule) {
      throw new NotFoundException();
    }

    // Admins and owners can always delete, members can only delete their own
    const isAdminOrOwner = role === 'owner' || role === 'admin';
    const isCreator = schedule.createdBy === user.id;

    if (!isAdminOrOwner && !isCreator) {
      throw new ForbiddenException('You can only delete schedules you created');
    }

    await this.schedulesRepository.delete(id);
  }
}
