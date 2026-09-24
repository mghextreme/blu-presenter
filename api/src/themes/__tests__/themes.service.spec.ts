import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { In } from 'typeorm';
import {
  ForbiddenException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ThemesService } from '../themes.service';
import { Theme } from '../../entities';
import { CreateThemeDto, SearchThemeDto, UpdateThemeDto } from '../../types';
import { UsersService } from '../../users/users.service';
import { OrganizationsService } from '../../organizations/organizations.service';
import { SessionsService } from '../../sessions/sessions.service';

describe('ThemesService', () => {
  let service: ThemesService;

  const mockTheme: Theme = {
    id: 1,
    orgId: 1,
    name: 'Test Theme',
    extends: 'lyrics',
    config: {
      backgroundColor: '#000000',
      foregroundColor: '#ffffff',
      invisibleOnEmptyItems: false,
    },
    organization: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = {
    user: {
      internal: { id: 1 },
      organization: 1,
    },
  };

  const mockThemesRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    findOneBy: jest.fn(),
    insert: jest.fn(),
    save: jest.fn(),
    delete: jest.fn(),
  };

  const mockUsersService = {
    findUserOrganizations: jest.fn(),
  };

  const mockOrganizationsService = {
    userRole: jest.fn(),
  };

  const mockSessionsService = {
    findOneBySecret: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ThemesService,
        {
          provide: getRepositoryToken(Theme),
          useValue: mockThemesRepository,
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
          provide: SessionsService,
          useValue: mockSessionsService,
        },
        {
          provide: REQUEST,
          useValue: mockRequest,
        },
      ],
    }).compile();

    // Use resolve() for request-scoped providers
    service = await module.resolve<ThemesService>(ThemesService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findOne', () => {
    it('should return a theme by id and orgId', async () => {
      mockThemesRepository.findOne.mockResolvedValue(mockTheme);

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockTheme);
      expect(mockThemesRepository.findOne).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          extends: true,
          config: true,
          organization: {
            id: true,
            name: true,
          },
        },
        where: {
          id: 1,
          orgId: 1,
        },
        relations: {
          organization: true,
        },
      });
    });

    it('should return null if theme not found', async () => {
      mockThemesRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('findOneInAnyOrg', () => {
    it('should return a theme with the user role in its organization', async () => {
      const userOrgs = [
        { organization: { id: 1, name: 'Org 1' }, role: 'member' },
      ];
      mockUsersService.findUserOrganizations.mockResolvedValue(userOrgs);
      mockThemesRepository.findOne.mockResolvedValue(mockTheme);

      const result = await service.findOneInAnyOrg(1);

      expect(result.organization).toEqual({
        id: 1,
        name: 'Org 1',
        role: 'member',
      });
    });

    it('should throw NotFoundException if theme is not in any user organization', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([]);
      mockThemesRepository.findOne.mockResolvedValue(null);

      await expect(service.findOneInAnyOrg(999)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('search', () => {
    it('should return themes for all organizations where the user is a member or above', async () => {
      const userOrgs = [
        { organization: { id: 1, name: 'Org 1' }, role: 'member' },
        { organization: { id: 2, name: 'Org 2' }, role: 'owner' },
        { organization: { id: 3, name: 'Org 3' }, role: 'guest' },
      ];
      mockUsersService.findUserOrganizations.mockResolvedValue(userOrgs);
      mockThemesRepository.find.mockResolvedValue([mockTheme]);

      const result = await service.search({});

      expect(result).toEqual([
        {
          ...mockTheme,
          organization: { id: 1, name: 'Org 1', role: 'member' },
        },
      ]);
      expect(mockThemesRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: In([1, 2]) }),
        }),
      );
    });

    it('should filter by requested organizations when provided', async () => {
      const userOrgs = [
        { organization: { id: 1, name: 'Org 1' }, role: 'member' },
        { organization: { id: 2, name: 'Org 2' }, role: 'owner' },
      ];
      mockUsersService.findUserOrganizations.mockResolvedValue(userOrgs);
      mockThemesRepository.find.mockResolvedValue([]);

      const searchDto: SearchThemeDto = { organizations: [2] };

      await service.search(searchDto);

      expect(mockThemesRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ orgId: In([2]) }),
        }),
      );
    });

    it('should throw ForbiddenException when requesting an organization the user does not have access to', async () => {
      const userOrgs = [
        { organization: { id: 1, name: 'Org 1' }, role: 'member' },
      ];
      mockUsersService.findUserOrganizations.mockResolvedValue(userOrgs);

      const searchDto: SearchThemeDto = { organizations: [999] };

      await expect(service.search(searchDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should throw ForbiddenException when requesting an organization where the user is only a guest', async () => {
      const userOrgs = [
        { organization: { id: 1, name: 'Org 1' }, role: 'guest' },
      ];
      mockUsersService.findUserOrganizations.mockResolvedValue(userOrgs);

      const searchDto: SearchThemeDto = { organizations: [1] };

      await expect(service.search(searchDto)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('should return an empty array if the user has no qualifying organizations', async () => {
      mockUsersService.findUserOrganizations.mockResolvedValue([]);

      const result = await service.search({});

      expect(result).toEqual([]);
      expect(mockThemesRepository.find).not.toHaveBeenCalled();
    });

    it('should map the user role into each theme organization', async () => {
      const userOrgs = [
        { organization: { id: 1, name: 'Org 1' }, role: 'admin' },
      ];
      mockUsersService.findUserOrganizations.mockResolvedValue(userOrgs);
      mockThemesRepository.find.mockResolvedValue([mockTheme]);

      const result = await service.search({});

      expect(result[0].organization).toEqual({
        id: 1,
        name: 'Org 1',
        role: 'admin',
      });
    });
  });

  describe('findAllForUserOrgs', () => {
    it('should return themes for all user organizations', async () => {
      const userOrgs = [
        { organization: { id: 1, name: 'Org 1' } },
        { organization: { id: 2, name: 'Org 2' } },
      ];
      mockUsersService.findUserOrganizations.mockResolvedValue(userOrgs);
      mockThemesRepository.find.mockResolvedValue([mockTheme]);

      const result = await service.findAllForUserOrgs();

      expect(result).toEqual([mockTheme]);
      expect(mockUsersService.findUserOrganizations).toHaveBeenCalledWith(1);
    });

    it('should throw UnauthorizedException if user is not authenticated', async () => {
      const moduleWithoutUser = await Test.createTestingModule({
        providers: [
          ThemesService,
          {
            provide: getRepositoryToken(Theme),
            useValue: mockThemesRepository,
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
            provide: SessionsService,
            useValue: mockSessionsService,
          },
          {
            provide: REQUEST,
            useValue: { user: undefined },
          },
        ],
      }).compile();

      const serviceWithoutUser =
        await moduleWithoutUser.resolve<ThemesService>(ThemesService);

      await expect(serviceWithoutUser.findAllForUserOrgs()).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });

  describe('create', () => {
    it('should create a new theme', async () => {
      const createThemeDto: CreateThemeDto = {
        name: 'New Theme',
        extends: 'lyrics',
        config: {},
      };

      mockThemesRepository.insert.mockResolvedValue({
        raw: [{ id: 1 }],
      });
      mockThemesRepository.findOne.mockResolvedValue(mockTheme);

      const result = await service.create(1, createThemeDto);

      expect(result).toEqual(mockTheme);
      expect(mockThemesRepository.insert).toHaveBeenCalledWith({
        name: createThemeDto.name,
        extends: createThemeDto.extends,
        config: createThemeDto.config,
        orgId: 1,
      });
    });
  });

  describe('update', () => {
    it('should update an existing theme', async () => {
      const updateThemeDto: UpdateThemeDto = {
        id: 1,
        name: 'Updated Theme',
        extends: 'subtitles',
        config: { backgroundColor: '#ffffff' },
      };

      mockThemesRepository.findOneBy.mockResolvedValue(mockTheme);
      mockThemesRepository.save.mockResolvedValue({
        ...mockTheme,
        ...updateThemeDto,
      });

      const result = await service.update(1, 1, updateThemeDto);

      expect(result.name).toBe(updateThemeDto.name);
      expect(mockThemesRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        orgId: 1,
      });
      expect(mockThemesRepository.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if theme does not exist', async () => {
      const updateThemeDto: UpdateThemeDto = {
        id: 999,
        name: 'Updated Theme',
        extends: 'lyrics',
        config: {},
      };

      mockThemesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.update(1, 999, updateThemeDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('delete', () => {
    it('should delete a theme', async () => {
      mockThemesRepository.findOneBy.mockResolvedValue(mockTheme);
      mockThemesRepository.delete.mockResolvedValue({ affected: 1 });

      await service.delete(1, 1);

      expect(mockThemesRepository.findOneBy).toHaveBeenCalledWith({
        id: 1,
        orgId: 1,
      });
      expect(mockThemesRepository.delete).toHaveBeenCalledWith(1);
    });

    it('should throw NotFoundException if theme does not exist', async () => {
      mockThemesRepository.findOneBy.mockResolvedValue(null);

      await expect(service.delete(1, 999)).rejects.toThrow(NotFoundException);
    });
  });
});
