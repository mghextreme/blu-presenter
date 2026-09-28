import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
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
    find: jest.fn(),
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
      mockSchedulesRepository.find.mockResolvedValue(schedules);

      const result = await service.search({});

      expect(result).toEqual([
        {
          ...schedules[0],
          organization: { id: 1, name: 'Member Org', role: 'member' },
        },
      ]);
      expect(mockSchedulesRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: In([1, 2]) }),
        }),
      );
    });

    it('should filter by requested organizations when provided', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
        { organization: { id: 2, name: 'Guest Org' }, role: 'guest' },
      ]);
      mockSchedulesRepository.find.mockResolvedValue([]);

      await service.search({ organizations: [2] });

      expect(mockSchedulesRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: In([2]) }),
        }),
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
      expect(mockSchedulesRepository.find).not.toHaveBeenCalled();
    });

    it('should map the user role into each schedule organization', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Guest Org' }, role: 'guest' },
      ]);
      mockSchedulesRepository.find.mockResolvedValue([
        mockSchedule({ id: 10, orgId: 1 }),
      ]);

      const result = await service.search({});

      expect(result[0].organization).toEqual({
        id: 1,
        name: 'Guest Org',
        role: 'guest',
      });
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
      mockSchedulesRepository.find.mockResolvedValue([]);

      await service.search({});

      expect(mockSchedulesRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: In([1]) }),
        }),
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
      mockSchedulesRepository.find.mockResolvedValue([]);

      await service.search({ organizations: [1, 2] });

      expect(mockSchedulesRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: In([1]) }),
        }),
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
