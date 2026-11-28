import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  ForbiddenException,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { DataSource } from 'typeorm';
import { OrganizationsService } from '../organizations.service';
import {
  Organization,
  OrganizationInvitation,
  OrganizationUser,
  User,
} from '../../entities';

describe('OrganizationsService', () => {
  let service: OrganizationsService;

  const mockOrganizationUsersRepository = {
    findOneBy: jest.fn(),
    delete: jest.fn(),
  };
  const mockDataSource = { transaction: jest.fn() };
  const mockInvitationsRepository = { findOne: jest.fn(), find: jest.fn() };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrganizationsService,
        { provide: DataSource, useValue: mockDataSource },
        { provide: getRepositoryToken(Organization), useValue: {} },
        {
          provide: getRepositoryToken(OrganizationUser),
          useValue: mockOrganizationUsersRepository,
        },
        { provide: getRepositoryToken(User), useValue: {} },
        {
          provide: getRepositoryToken(OrganizationInvitation),
          useValue: mockInvitationsRepository,
        },
      ],
    }).compile();

    service = module.get<OrganizationsService>(OrganizationsService);
  });

  describe('leave', () => {
    it.each(['admin', 'member', 'guest'])(
      'removes a %s from the organization',
      async (role) => {
        mockOrganizationUsersRepository.findOneBy.mockResolvedValue({
          orgId: 1,
          userId: 10,
          role,
        });

        await service.leave(1, 10);

        expect(mockOrganizationUsersRepository.delete).toHaveBeenCalledWith({
          orgId: 1,
          userId: 10,
        });
      },
    );

    it('does not let the owner leave', async () => {
      mockOrganizationUsersRepository.findOneBy.mockResolvedValue({
        orgId: 1,
        userId: 10,
        role: 'owner',
      });

      await expect(service.leave(1, 10)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(mockOrganizationUsersRepository.delete).not.toHaveBeenCalled();
    });

    it('throws NotFound when the user is not a member', async () => {
      mockOrganizationUsersRepository.findOneBy.mockResolvedValue(null);

      await expect(service.leave(1, 10)).rejects.toThrow(NotFoundException);
      expect(mockOrganizationUsersRepository.delete).not.toHaveBeenCalled();
    });
  });

  describe('transferOwnership', () => {
    const owner = { userId: 10, role: 'owner' as const };

    it('rejects transferring ownership to the current owner', async () => {
      await expect(service.transferOwnership(1, owner, 10)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('runs the transfer for another member', async () => {
      mockDataSource.transaction.mockResolvedValue(undefined);

      await service.transferOwnership(1, owner, 20);

      expect(mockDataSource.transaction).toHaveBeenCalled();
    });

    it('refuses callers who are not the owner', async () => {
      await expect(
        service.transferOwnership(1, { userId: 10, role: 'admin' }, 20),
      ).rejects.toThrow(ForbiddenException);
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });
  });

  describe('invitations', () => {
    it('finds nothing without a secret', async () => {
      await expect(service.getInvitation(3, undefined)).resolves.toBeNull();
      expect(mockInvitationsRepository.findOne).not.toHaveBeenCalled();
    });

    it.each([
      ['getInvitation', () => service.getInvitation(3, 's'), 'findOne'],
      [
        'getInvitationsForEmail',
        () => service.getInvitationsForEmail('a@example.com'),
        'find',
      ],
    ] as const)(
      '%s never loads the organization secret',
      async (_name, call, method) => {
        await call();

        const query = mockInvitationsRepository[method].mock.calls[0][0];
        expect(query.select.organization).toEqual({ id: true, name: true });
      },
    );
  });
});
