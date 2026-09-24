import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { CreateThemeDto, SearchThemeDto, UpdateThemeDto } from 'src/types';
import { isRoleHigherOrEqualThan } from 'src/types/organization-role.type';
import { OrganizationRoleOptions } from 'src/types';
import { OrganizationUser, Theme } from 'src/entities';
import { UsersService } from 'src/users/users.service';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { ThemeWithRoleViewModel } from 'src/models/theme-with-role.view-model';

@Injectable({ scope: Scope.REQUEST })
export class ThemesService {
  constructor(
    @InjectRepository(Theme)
    private readonly themesRepository: Repository<Theme>,
    @Inject(OrganizationsService)
    private readonly organizationsService: OrganizationsService,
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
        organization: {
          id: true,
          name: true,
        },
      },
      where: {
        id,
        orgId,
      },
      relations: {
        organization: true,
      },
    });
  }

  async findOneInAnyOrg(id: number): Promise<ThemeWithRoleViewModel> {
    if (this.request.user === undefined) {
      throw new UnauthorizedException();
    }

    const user = this.request.user['internal'];
    const userOrgs = await this.usersService.findUserOrganizations(user.id);
    const userOrgIds = userOrgs.map((org) => org.organization.id);

    const theme = await this.themesRepository.findOne({
      select: {
        id: true,
        orgId: true,
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
        id,
        orgId: In(userOrgIds),
      },
    });

    if (!theme) {
      throw new NotFoundException();
    }

    const orgUser = userOrgs.find((org) => org.organization.id === theme.orgId);
    return {
      ...theme,
      organization: orgUser
        ? {
            ...orgUser.organization,
            role: orgUser.role as OrganizationRoleOptions,
          }
        : {
            ...theme.organization,
            role: undefined,
          },
    } as ThemeWithRoleViewModel;
  }

  async search(searchDto: SearchThemeDto): Promise<ThemeWithRoleViewModel[]> {
    const user = this.request.user['internal'];
    const userOrgs = await this.usersService.findUserOrganizations(user.id);
    // Only include orgs where the user is a member or above, mirroring the role
    // policy of the previous per-org list endpoint (guests may not list themes).
    const memberOrgs = userOrgs.filter((org) =>
      isRoleHigherOrEqualThan(org.role, 'member'),
    );
    const memberOrgIds = memberOrgs.map((org) => org.organization.id);

    let orgIds: number[];
    if (searchDto.organizations && searchDto.organizations.length > 0) {
      if (
        !searchDto.organizations.every((id: number) =>
          memberOrgIds.includes(id),
        )
      ) {
        throw new ForbiddenException(
          "You selected an organization which you don't have permissions to access.",
        );
      }

      orgIds = searchDto.organizations;
    } else {
      orgIds = memberOrgIds;
    }

    if (orgIds.length === 0) {
      return [];
    }

    const pageSize = searchDto.itemsPerPage ?? 20;
    const page = searchDto.page ?? 1;

    const themes = await this.themesRepository.find({
      select: {
        id: true,
        orgId: true,
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
        orgId: In(orgIds),
        ...(searchDto.query ? { name: ILike(`%${searchDto.query}%`) } : {}),
      },
      order: {
        name: 'asc',
      },
      skip: pageSize * (page - 1),
      take: pageSize,
    });

    const userOrgsMap: { [key: number]: Partial<OrganizationUser> } = {};
    for (const org of userOrgs) {
      userOrgsMap[org.organization.id] = org;
    }

    return themes.map((theme) => {
      const orgUser = userOrgsMap[theme.orgId];
      return {
        ...theme,
        organization: orgUser
          ? {
              ...orgUser.organization,
              role: orgUser.role as OrganizationRoleOptions,
            }
          : {
              ...theme.organization,
              role: undefined,
            },
      } as ThemeWithRoleViewModel;
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
        orgId: In(userOrgIds),
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

  async findAllForSession(
    orgId: number,
    sessionId: number,
    secret: string,
    theme?: number,
  ): Promise<Theme[]> {
    const session = await this.sessionsService.findOneBySecret(
      orgId,
      sessionId,
      secret,
    );
    if (!session) {
      return [];
    }

    if (
      !theme &&
      session.theme &&
      !['lyrics', 'subtitles', 'teleprompter'].includes(session.theme)
    ) {
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

  async findOneInOrgBySecret(
    orgId: number,
    id: number,
    secret: string,
  ): Promise<Theme> {
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

  async copyToOrganization(
    themeId: number,
    organizationId: number,
  ): Promise<void> {
    const orgId = this.request.user['organization'];
    const theme = await this.findOne(orgId, themeId);
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    const userId = this.request.user['internal']?.id;
    const userRole = await this.organizationsService.userRole(
      organizationId,
      userId,
    );

    if (!userRole || !['owner', 'admin', 'member'].includes(userRole)) {
      throw new NotFoundException(
        'User does not have permission to copy theme to this organization',
      );
    }

    this.create(organizationId, {
      name: theme.name,
      extends: theme.extends,
      config: theme.config,
    });
  }
}
