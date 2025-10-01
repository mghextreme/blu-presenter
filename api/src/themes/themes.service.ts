import { Inject, Injectable, NotFoundException, Scope, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { CreateThemeDto, UpdateThemeDto } from 'src/types';
import { OrganizationUser, Theme } from 'src/entities';
import { UsersService } from 'src/users/users.service';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { SessionsService } from 'src/sessions/sessions.service';

@Injectable({ scope: Scope.REQUEST })
export class ThemesService {
  constructor(
    @InjectRepository(Theme) private readonly themesRepository: Repository<Theme>,
    @Inject(OrganizationsService) private readonly organizationsService: OrganizationsService,
    @Inject(UsersService) private readonly usersService: UsersService,
    @Inject(SessionsService) private readonly sessionsService: SessionsService,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {}

  async findOne(orgId: number, id: number): Promise<Theme | null> {
    return this.themesRepository.findOne({
      select: {
        id: true,
        name: true,
        extends: true,
        config: true,
      },
      where: {
        id,
        orgId,
      },
    });
  }

  async findAll(orgId: number): Promise<Theme[]> {
    return this.themesRepository.find({
      select: {
        id: true,
        name: true,
        extends: true,
        config: true,
      },
      where: {
        orgId,
      },
      order: {
        name: 'asc',
      },
    });
  }

  async findAllForUserOrgs(): Promise<Theme[] | null> {
    let userOrgs: Partial<OrganizationUser>[] = [];
    let userOrgIds: number[] = [];

    if (this.request.user === undefined) {
      throw new UnauthorizedException();
    }

    const user = this.request.user['internal'];
    userOrgs = await this.usersService.findUserOrganizations(user.id);
    userOrgIds = userOrgs.map((org) => org.organization.id);

    return await this.themesRepository.find({
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
      relations: {
        organization: true,
      },
      where: {
        orgId: In(userOrgIds)
      },
    });
  }

  async findAllInOrgBySecret(orgId: number, secret: string): Promise<Theme[]> {
    return await this.themesRepository.find({
      select: {
        id: true,
        name: true,
        extends: true,
        config: true,
      },
      where: {
        orgId,
        organization: {
          secret,
        },
      },
      order: {
        name: 'asc',
      },
    });
  }

  async findAllForSession(orgId: number, sessionId: number, secret: string, theme?: number): Promise<Theme[]> {
    const session = await this.sessionsService.findOneBySecret(orgId, sessionId, secret);
    if (!session) {
      return [];
    }

    if (!theme && session.theme && !['lyrics', 'subtitles', 'teleprompter'].includes(session.theme)) {
      theme = Number(session.theme);
    }

    return await this.themesRepository.find({
      select: {
        id: true,
        name: true,
        extends: true,
        config: true,
      },
      where: {
        orgId,
        id: theme,
      },
      order: {
        name: 'asc',
      },
    });
  }

  async findOneInOrgBySecret(orgId: number, id: number, secret: string): Promise<Theme> {
    const theme = await this.themesRepository.findOne({
      select: {
        id: true,
        name: true,
        extends: true,
        config: true,
      },
      where: {
        id,
        orgId,
        organization: {
          secret,
        },
      },
      order: {
        name: 'asc',
      },
    });

    if (!theme) {
      throw new NotFoundException();
    }

    return theme;
  }

  async create(orgId: number, createThemeDto: CreateThemeDto): Promise<Theme> {
    const result = await this.themesRepository.insert({
      name: createThemeDto.name,
      extends: createThemeDto.extends,
      config: createThemeDto.config,
      orgId,
    });
    const themeId = result.raw[0].id;

    return this.findOne(orgId, themeId);
  }

  async update(
    orgId: number,
    id: number,
    updateThemeDto: UpdateThemeDto,
  ): Promise<Theme> {
    const theme = await this.themesRepository.findOneBy({ id, orgId });
    if (!theme) {
      throw new NotFoundException();
    }

    theme.name = updateThemeDto.name;
    theme.extends = updateThemeDto.extends;
    theme.config = updateThemeDto.config;

    const result = await this.themesRepository.save(theme);
    return result as Theme;
  }

  async delete(orgId: number, id: number): Promise<void> {
    const theme = await this.themesRepository.findOneBy({ id, orgId });
    if (!theme) {
      throw new NotFoundException();
    }

    await this.themesRepository.delete(id);
  }

  async copyToOrganization(themeId: number, organizationId: number): Promise<void> {
    const orgId = this.request.user['organization'];
    const theme = await this.findOne(orgId, themeId)
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    const userId = this.request.user['internal']?.id;
    const userRole = await this.organizationsService.userRole(organizationId, userId);

    if (!userRole || !['owner', 'admin', 'member'].includes(userRole)) {
      throw new NotFoundException('User does not have permission to copy theme to this organization');
    }

    this.create(
      organizationId,
      {
        name: theme.name,
        extends: theme.extends,
        config: theme.config,
      }
    );
  }
}
