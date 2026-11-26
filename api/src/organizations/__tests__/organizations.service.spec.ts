import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
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
  const mockRequest = {
    user: { organization: 1, internal: { id: 10 }, role: 'owner' },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRequest.user.role = 'owner';

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
        { provide: getRepositoryToken(OrganizationInvitation), useValue: {} },
        { provide: REQUEST, useValue: mockRequest },
      ],
    }).compile();

    service = await module.resolve<OrganizationsService>(OrganizationsService);
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
    it('rejects transferring ownership to the current owner', async () => {
      await expect(service.transferOwnership(10)).rejects.toThrow(
        UnprocessableEntityException,
      );
      expect(mockDataSource.transaction).not.toHaveBeenCalled();
    });

    it('runs the transfer for another member', async () => {
      mockDataSource.transaction.mockResolvedValue(undefined);

      await service.transferOwnership(20);

      expect(mockDataSource.transaction).toHaveBeenCalled();
    });
  });
});
