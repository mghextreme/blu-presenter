import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import {
  CreateThemeDto,
  isFeatureEnabled,
  SearchThemeDto,
  UpdateThemeDto,
} from 'src/types';
import { isRoleHigherOrEqualThan } from 'src/types/organization-role.type';
import { Theme, User } from 'src/entities';
import { UsersService } from 'src/users/users.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { SessionsService } from 'src/sessions/sessions.service';
import { ThemeWithRoleViewModel } from 'src/models/theme-with-role.view-model';
import {
  membershipOrgIds,
  withOrganizationRole,
} from 'src/utils/organization-membership';

@Injectable()
export class ThemesService {
  constructor(
    @InjectRepository(Theme)
    private readonly themesRepository: Repository<Theme>,
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
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

  async findOneInAnyOrg(
    id: number,
    user: User,
  ): Promise<ThemeWithRoleViewModel> {
    const userOrgs = await this.usersService.findUserOrganizations(user.id);
    const userOrgIds = membershipOrgIds(userOrgs);

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

    await this.assertFeatureEnabledForOrg(theme.orgId);

    return withOrganizationRole(theme, userOrgs) as ThemeWithRoleViewModel;
  }

  private async assertFeatureEnabledForOrg(orgId: number): Promise<void> {
    const featureEnabled =
      await this.organizationsService.isFeatureEnabledInOrg(orgId, 'themes');
    if (!featureEnabled) {
      throw new ForbiddenException('Themes are disabled for this organization');
    }
  }

  async search(
    searchDto: SearchThemeDto,
    user: User,
  ): Promise<ThemeWithRoleViewModel[]> {
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

    // Exclude organizations which disabled the themes feature
    const orgFeaturesById = new Map(
      userOrgs.map((org) => [
        org.organization.id,
        org.organization.disabledFeatures,
      ]),
    );
    orgIds = orgIds.filter((orgId) =>
      isFeatureEnabled(orgFeaturesById.get(orgId), 'themes'),
    );

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

    return themes.map(
      (theme) =>
        withOrganizationRole(theme, userOrgs) as ThemeWithRoleViewModel,
    );
  }

  async findAllForUserOrgs(user: User): Promise<Theme[]> {
    const userOrgs = await this.usersService.findUserOrganizations(user.id);
    const userOrgIds = membershipOrgIds(
      userOrgs.filter((org) =>
        isFeatureEnabled(org.organization.disabledFeatures, 'themes'),
      ),
    );

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
    await this.organizationsService.assertFeatureEnabled(orgId, 'themes', {
      notFound: true,
    });

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

    // The URL theme is authoritative; otherwise fall back to the session's
    // own theme. Neither may exist (receiver URL without ?theme= and the
    // session theme unset or one of the built-in themes) — in that case no
    // id constraint is applied at all and the org's themes are listed.
    // Sending an undefined id into a where clause makes newer TypeORM
    // versions throw "Undefined value encountered in property 'Theme.id'".
    // A non-numeric URL theme (a built-in one such as `lyrics`) is still
    // authoritative: it must not fall back to the session's custom theme.
    const hasUrlTheme =
      theme !== undefined && theme !== null && String(theme) !== '';
    const urlThemeId = hasUrlTheme ? Number(theme) : Number.NaN;
    let themeId: number | undefined = undefined;
    if (Number.isFinite(urlThemeId) && urlThemeId > 0) {
      themeId = urlThemeId;
    } else if (
      !hasUrlTheme &&
      session.theme &&
      !['lyrics', 'subtitles', 'teleprompter'].includes(session.theme)
    ) {
      const fromSession = Number(session.theme);
      if (Number.isFinite(fromSession) && fromSession > 0) {
        themeId = fromSession;
      }
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
        ...(themeId !== undefined ? { id: themeId } : {}),
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
    await this.organizationsService.assertFeatureEnabled(orgId, 'themes', {
      notFound: true,
    });

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

  async create(
    orgId: number,
    createThemeDto: CreateThemeDto,
  ): Promise<Theme | null> {
    await this.organizationsService.assertFeatureEnabled(orgId, 'themes');

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
    await this.organizationsService.assertFeatureEnabled(orgId, 'themes');

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
    await this.organizationsService.assertFeatureEnabled(orgId, 'themes');

    const theme = await this.themesRepository.findOneBy({ id, orgId });
    if (!theme) {
      throw new NotFoundException();
    }

    await this.themesRepository.delete(id);
  }

  async copyToOrganization(
    orgId: number,
    themeId: number,
    organizationId: number,
    userId: number,
  ): Promise<void> {
    await this.organizationsService.assertFeatureEnabled(orgId, 'themes', {
      notFound: true,
    });

    const theme = await this.findOne(orgId, themeId);
    if (!theme) {
      throw new NotFoundException('Theme not found');
    }

    const userRole = await this.organizationsService.userRole(
      organizationId,
      userId,
    );

    if (!userRole || !['owner', 'admin', 'member'].includes(userRole)) {
      throw new NotFoundException(
        'User does not have permission to copy theme to this organization',
      );
    }

    await this.create(organizationId, {
      name: theme.name,
      extends: theme.extends,
      config: theme.config,
    });
  }
}
