import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { SchedulesService } from '../schedules.service';
import { Schedule, Song } from '../../entities';
import { UsersService } from '../../users/users.service';
import { OrganizationsBaseService } from '../../organizations/organizations.service';

describe('SchedulesService', () => {
  let service: SchedulesService;

  const mockSchedule = (overrides: Partial<Schedule> = {}): Schedule =>
    ({
      id: 1,
      orgId: 1,
      title: 'Test Schedule',
      date: '2026-01-01',
      secret: 'abcdefghij',
      createdBy: 42,
      createdAt: new Date(),
      updatedAt: new Date(),
      ...overrides,
    }) as Schedule;

  const mockRequest = {
    user: {
      internal: { id: 42 },
      organization: 1,
    },
  };

  const mockSchedulesRepository = {
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    insert: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockSongsRepository = {
    createQueryBuilder: jest.fn(),
  };

  const mockUsersService = {
    findUserOrganizations: jest.fn(),
  };

  const mockOrganizationsBaseService = {
    isFeatureEnabledInOrg: jest.fn().mockResolvedValue(true),
    assertFeatureEnabled: jest.fn().mockResolvedValue(undefined),
  };

  type QueryBuilderMock = ReturnType<typeof mockQueryBuilder>;

  const mockQueryBuilder = () => {
    const builder: {
      select: jest.Mock;
      addSelect: jest.Mock;
      leftJoin: jest.Mock;
      where: jest.Mock;
      andWhere: jest.Mock;
      orderBy: jest.Mock;
      addOrderBy: jest.Mock;
      skip: jest.Mock;
      take: jest.Mock;
      getMany: jest.Mock;
    } = {
      select: jest.fn(),
      addSelect: jest.fn(),
      leftJoin: jest.fn(),
      where: jest.fn(),
      andWhere: jest.fn(),
      orderBy: jest.fn(),
      addOrderBy: jest.fn(),
      skip: jest.fn(),
      take: jest.fn(),
      getMany: jest.fn(),
    };
    for (const method of Object.keys(builder)) {
      if (method === 'getMany') continue;
      builder[method as keyof typeof builder].mockReturnValue(builder);
    }
    builder.getMany.mockResolvedValue([]);
    return builder;
  };

  let queryBuilder: QueryBuilderMock;

  const buildModule = async (
    request: any = mockRequest,
  ): Promise<TestingModule> =>
    Test.createTestingModule({
      providers: [
        SchedulesService,
        {
          provide: getRepositoryToken(Schedule),
          useValue: mockSchedulesRepository,
        },
        {
          provide: getRepositoryToken(Song),
          useValue: mockSongsRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: OrganizationsBaseService,
          useValue: mockOrganizationsBaseService,
        },
        {
          provide: REQUEST,
          useValue: request,
        },
      ],
    }).compile();

  beforeEach(async () => {
    queryBuilder = mockQueryBuilder();
    mockSchedulesRepository.createQueryBuilder.mockReturnValue(queryBuilder);

    const module = await buildModule();
    service = await module.resolve<SchedulesService>(SchedulesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('search', () => {
    it('should return schedules for all user organizations, including guest orgs', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
        { organization: { id: 2, name: 'Guest Org' }, role: 'guest' },
      ]);
      const schedules = [mockSchedule({ id: 10, orgId: 1 })];
      queryBuilder.getMany.mockResolvedValue(schedules);

      const result = await service.search({});

      expect(result).toEqual([
        {
          ...schedules[0],
          organization: { id: 1, name: 'Member Org', role: 'member' },
        },
      ]);
      expect(queryBuilder.where).toHaveBeenCalledWith(
        '"schedule"."orgId" IN (:...orgIds)',
        { orgIds: [1, 2] },
      );
    });

    it('should filter by requested organizations when provided', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
        { organization: { id: 2, name: 'Guest Org' }, role: 'guest' },
      ]);

      await service.search({ organizations: [2] });

      expect(queryBuilder.where).toHaveBeenCalledWith(
        '"schedule"."orgId" IN (:...orgIds)',
        { orgIds: [2] },
      );
    });

    it('should throw ForbiddenException when requesting an organization the user does not belong to', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
      ]);

      await expect(service.search({ organizations: [999] })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return an empty array without querying when the user belongs to no organizations', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([]);

      const result = await service.search({});

      expect(result).toEqual([]);
      expect(mockSchedulesRepository.createQueryBuilder).not.toHaveBeenCalled();
    });

    it('should map the user role into each schedule organization', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Guest Org' }, role: 'guest' },
      ]);
      queryBuilder.getMany.mockResolvedValue([
        mockSchedule({ id: 10, orgId: 1 }),
      ]);

      const result = await service.search({});

      expect(result[0].organization).toEqual({
        id: 1,
        name: 'Guest Org',
        role: 'guest',
      });
    });

    it('should filter by title when a query is given', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
      ]);

      await service.search({ query: 'worship' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '"schedule"."title" ILIKE :query',
        { query: '%worship%' },
      );
    });

    it('should not filter by title when no query is given', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
      ]);

      await service.search({});

      expect(queryBuilder.andWhere).not.toHaveBeenCalled();
    });

    it('should filter by both date range bounds when given', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
      ]);

      await service.search({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });

      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '"schedule"."date" >= :dateFrom',
        { dateFrom: '2026-01-01' },
      );
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '"schedule"."date" <= :dateTo',
        { dateTo: '2026-01-31' },
      );
    });

    it('should filter by only the bound that is given', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
      ]);

      await service.search({ dateFrom: '2026-01-01' });

      expect(queryBuilder.andWhere).toHaveBeenCalledTimes(1);
      expect(queryBuilder.andWhere).toHaveBeenCalledWith(
        '"schedule"."date" >= :dateFrom',
        { dateFrom: '2026-01-01' },
      );
    });

    it('should throw BadRequestException when the date range is inverted', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
      ]);

      await expect(
        service.search({ dateFrom: '2026-02-01', dateTo: '2026-01-01' }),
      ).rejects.toThrow(BadRequestException);
      expect(queryBuilder.where).not.toHaveBeenCalled();
    });

    it('should order by the date with a creation date fallback and paginate', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
      ]);

      await service.search({ page: 2, itemsPerPage: 10 });

      expect(queryBuilder.addSelect).toHaveBeenCalledWith(
        'COALESCE("schedule"."date", CAST("schedule"."createdAt" AS DATE))',
        'date_sort',
      );
      expect(queryBuilder.orderBy).toHaveBeenCalledWith('date_sort', 'DESC');
      expect(queryBuilder.addOrderBy).toHaveBeenCalledWith(
        'schedule.id',
        'DESC',
      );
      expect(queryBuilder.skip).toHaveBeenCalledWith(10);
      expect(queryBuilder.take).toHaveBeenCalledWith(10);
    });
  });

  describe('feature gating (schedules disabled per organization)', () => {
    it('should exclude orgs with the schedules feature disabled from search', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Enabled Org' }, role: 'member' },
        {
          organization: {
            id: 2,
            name: 'Disabled Org',
            disabledFeatures: ['schedules'],
          },
          role: 'member',
        },
      ]);

      await service.search({});

      expect(queryBuilder.where).toHaveBeenCalledWith(
        '"schedule"."orgId" IN (:...orgIds)',
        { orgIds: [1] },
      );
    });

    it('should silently exclude explicitly selected orgs with the schedules feature disabled', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Enabled Org' }, role: 'member' },
        {
          organization: {
            id: 2,
            name: 'Disabled Org',
            disabledFeatures: ['schedules'],
          },
          role: 'owner',
        },
      ]);

      await service.search({ organizations: [1, 2] });

      expect(queryBuilder.where).toHaveBeenCalledWith(
        '"schedule"."orgId" IN (:...orgIds)',
        { orgIds: [1] },
      );
    });

    it('should throw ForbiddenException from findOneInAnyOrgOrBySecret for authenticated users when disabled', async () => {
      mockSchedulesRepository.findOne.mockResolvedValue(
        mockSchedule({ id: 10, orgId: 1 }),
      );
      mockOrganizationsBaseService.isFeatureEnabledInOrg.mockResolvedValue(
        false,
      );

      await expect(service.findOneInAnyOrgOrBySecret(10)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw NotFoundException from findOneInAnyOrgOrBySecret for anonymous callers when disabled', async () => {
      const moduleWithoutUser = await buildModule({ user: undefined });
      const serviceWithoutUser =
        await moduleWithoutUser.resolve<SchedulesService>(SchedulesService);

      mockSchedulesRepository.findOne.mockResolvedValue(
        mockSchedule({ id: 10, orgId: 1 }),
      );
      mockOrganizationsBaseService.isFeatureEnabledInOrg.mockResolvedValue(
        false,
      );

      await expect(
        serviceWithoutUser.findOneInAnyOrgOrBySecret(10, 'secret'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should assert the schedules feature is enabled on create', async () => {
      mockSchedulesRepository.insert.mockResolvedValue({
        raw: [{ id: 99 }],
      });

      await service.create(1, { title: 'New Schedule' } as any);

      expect(
        mockOrganizationsBaseService.assertFeatureEnabled,
      ).toHaveBeenCalledWith(1, 'schedules');
    });
  });
});
