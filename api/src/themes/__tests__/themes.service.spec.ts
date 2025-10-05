import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { ThemesService } from '../themes.service';
import { Theme } from '../../entities';
import { CreateThemeDto, UpdateThemeDto } from '../../types';
import { UsersService } from '../../users/users.service';
import { OrganizationsService } from '../../organizations/organizations.service';
import { SessionsService } from '../../sessions/sessions.service';

describe('ThemesService', () => {
  let service: ThemesService;
  let themesRepository: Repository<Theme>;
  let usersService: UsersService;
  let organizationsService: OrganizationsService;
  let sessionsService: SessionsService;

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
    themesRepository = module.get<Repository<Theme>>(getRepositoryToken(Theme));
    usersService = module.get<UsersService>(UsersService);
    organizationsService = module.get<OrganizationsService>(OrganizationsService);
    sessionsService = module.get<SessionsService>(SessionsService);
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
        },
        where: {
          id: 1,
          orgId: 1,
        },
      });
    });

    it('should return null if theme not found', async () => {
      mockThemesRepository.findOne.mockResolvedValue(null);

      const result = await service.findOne(1, 999);

      expect(result).toBeNull();
    });
  });

  describe('findAll', () => {
    it('should return all themes for an organization', async () => {
      const themes = [mockTheme, { ...mockTheme, id: 2, name: 'Theme 2' }];
      mockThemesRepository.find.mockResolvedValue(themes);

      const result = await service.findAll(1);

      expect(result).toEqual(themes);
      expect(mockThemesRepository.find).toHaveBeenCalledWith({
        select: {
          id: true,
          name: true,
          extends: true,
          config: true,
        },
        where: {
          orgId: 1,
        },
        order: {
          name: 'asc',
        },
      });
    });

    it('should return empty array if no themes found', async () => {
      mockThemesRepository.find.mockResolvedValue([]);

      const result = await service.findAll(1);

      expect(result).toEqual([]);
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

      const serviceWithoutUser = await moduleWithoutUser.resolve<ThemesService>(ThemesService);

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

