import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { SessionsServiceWithRequest } from '../sessions.service';
import { Session } from '../../entities';
import { UsersService } from '../../users/users.service';
import { OrganizationsService } from '../../organizations/organizations.service';

describe('SessionsServiceWithRequest', () => {
  let service: SessionsServiceWithRequest;

  const mockSession = (overrides: Partial<Session> = {}): Session =>
    ({
      id: 1,
      orgId: 1,
      name: 'Test Session',
      ...overrides,
    }) as Session;

  const mockRequest = {
    user: {
      internal: { id: 42 },
      organization: 1,
    },
  };

  const mockSessionsRepository = {
    find: jest.fn(),
  };

  const mockUsersService = {
    findUserOrganizations: jest.fn(),
  };

  const mockOrganizationsService = {
    userRole: jest.fn(),
  };

  const buildModule = async (
    request: any = mockRequest,
  ): Promise<TestingModule> =>
    Test.createTestingModule({
      providers: [
        SessionsServiceWithRequest,
        {
          provide: getRepositoryToken(Session),
          useValue: mockSessionsRepository,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
        {
          provide: OrganizationsService,
          useValue: mockOrganizationsService,
        },
        {
          provide: REQUEST,
          useValue: request,
        },
      ],
    }).compile();

  beforeEach(async () => {
    const module = await buildModule();
    service = await module.resolve<SessionsServiceWithRequest>(
      SessionsServiceWithRequest,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findAllForUserOrgs', () => {
    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const moduleWithoutUser = await buildModule({ user: undefined });
      const serviceWithoutUser =
        await moduleWithoutUser.resolve<SessionsServiceWithRequest>(
          SessionsServiceWithRequest,
        );

      await expect(serviceWithoutUser.findAllForUserOrgs()).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should include sessions for orgs where the user is owner, admin, or member', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Owned Org' }, role: 'owner' },
        { organization: { id: 2, name: 'Admin Org' }, role: 'admin' },
        { organization: { id: 3, name: 'Member Org' }, role: 'member' },
      ]);
      const sessions = [
        mockSession({ id: 10, orgId: 1 }),
        mockSession({ id: 11, orgId: 2 }),
        mockSession({ id: 12, orgId: 3 }),
      ];
      mockSessionsRepository.find.mockResolvedValue(sessions);

      const result = await service.findAllForUserOrgs();

      expect(result).toEqual(sessions);
      expect(mockUsersService.findUserOrganizations).toHaveBeenCalledWith(42);
      expect(mockSessionsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: In([1, 2, 3]) },
        }),
      );
    });

    it('should exclude orgs where the user is only a guest', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
        { organization: { id: 2, name: 'Guest Org' }, role: 'guest' },
      ]);
      mockSessionsRepository.find.mockResolvedValue([
        mockSession({ id: 10, orgId: 1 }),
      ]);

      await service.findAllForUserOrgs();

      // Only the member org id should reach the SQL query — guest org id 2 must be filtered out.
      expect(mockSessionsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orgId: In([1]) },
        }),
      );
    });

    it('should return an empty array (without querying) when the user is only a guest', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Guest Org A' }, role: 'guest' },
        { organization: { id: 2, name: 'Guest Org B' }, role: 'guest' },
      ]);

      const result = await service.findAllForUserOrgs();

      expect(result).toEqual([]);
      // Avoid calling TypeORM with `In([])`, which would build an invalid SQL fragment.
      expect(mockSessionsRepository.find).not.toHaveBeenCalled();
    });

    it('should return an empty array when the user belongs to no organizations', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([]);

      const result = await service.findAllForUserOrgs();

      expect(result).toEqual([]);
      expect(mockSessionsRepository.find).not.toHaveBeenCalled();
    });
  });

  describe('search', () => {
    it('should return sessions for all organizations where the user is a member or above', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
        { organization: { id: 2, name: 'Guest Org' }, role: 'guest' },
      ]);
      const sessions = [mockSession({ id: 10, orgId: 1 })];
      mockSessionsRepository.find.mockResolvedValue(sessions);

      const result = await service.search({});

      expect(result).toEqual([
        {
          ...sessions[0],
          organization: { id: 1, name: 'Member Org', role: 'member' },
        },
      ]);
      expect(mockSessionsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: In([1]) }),
        }),
      );
    });

    it('should filter by requested organizations when provided', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
        { organization: { id: 2, name: 'Owner Org' }, role: 'owner' },
      ]);
      mockSessionsRepository.find.mockResolvedValue([]);

      await service.search({ organizations: [2] });

      expect(mockSessionsRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: In([2]) }),
        }),
      );
    });

    it('should throw ForbiddenException when requesting an organization the user does not have access to', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Member Org' }, role: 'member' },
      ]);

      await expect(service.search({ organizations: [999] })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when requesting an organization where the user is only a guest', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Guest Org' }, role: 'guest' },
      ]);

      await expect(service.search({ organizations: [1] })).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return an empty array without querying when no org qualifies', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Guest Org' }, role: 'guest' },
      ]);

      const result = await service.search({});

      expect(result).toEqual([]);
      expect(mockSessionsRepository.find).not.toHaveBeenCalled();
    });

    it('should map the user role into each session organization', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([
        { organization: { id: 1, name: 'Admin Org' }, role: 'admin' },
      ]);
      mockSessionsRepository.find.mockResolvedValue([
        mockSession({ id: 10, orgId: 1 }),
      ]);

      const result = await service.search({});

      expect(result[0].organization).toEqual({
        id: 1,
        name: 'Admin Org',
        role: 'admin',
      });
    });
  });
});
