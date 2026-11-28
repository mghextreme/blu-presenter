import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { Session, User } from 'src/entities';
import { UsersService } from 'src/users/users.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import {
  CreateSessionDto,
  isFeatureEnabled,
  SearchSessionDto,
  UpdateSessionDto,
} from 'src/types';
import { isRoleHigherOrEqualThan } from 'src/types/organization-role.type';
import {
  membershipOrgIds,
  WithOrganizationRole,
  withOrganizationRole,
} from 'src/utils/organization-membership';

export type SessionWithRole = WithOrganizationRole<Session>;

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    private readonly sessionsRepository: Repository<Session>,
    private readonly organizationsService: OrganizationsService,
    private readonly usersService: UsersService,
  ) {}

  async findOne(orgId: number, id: number): Promise<Session | null> {
    return this.sessionsRepository.findOne({
      select: {
        id: true,
        orgId: true,
        name: true,
        language: true,
        theme: true,
        secret: true,
        default: true,
        schedule: true,
        scheduleItem: true,
        selection: true,
        updatedAt: true,
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
        orgId,
      },
    });
  }

  async setSchedule(orgId: number, id: number, schedule: any[]): Promise<void> {
    const result = await this.sessionsRepository.update(
      { id, orgId },
      { schedule },
    );
    if (!result.affected) {
      throw new NotFoundException();
    }
  }

  async setScheduleItem(
    orgId: number,
    id: number,
    scheduleItem: any,
  ): Promise<void> {
    const result = await this.sessionsRepository.update(
      { id, orgId },
      { scheduleItem },
    );
    if (!result.affected) {
      throw new NotFoundException();
    }
  }

  async setSelection(orgId: number, id: number, selection: any): Promise<void> {
    const result = await this.sessionsRepository.update(
      { id, orgId },
      { selection },
    );
    if (!result.affected) {
      throw new NotFoundException();
    }
  }

  async findOneBySecret(orgId: number, id: number, secret: string) {
    await this.organizationsService.assertFeatureEnabled(orgId, 'sessions', {
      notFound: true,
    });

    return this.sessionsRepository.findOne({
      select: {
        id: true,
        name: true,
        language: true,
        theme: true,
        default: true,
        schedule: true,
        scheduleItem: true,
        selection: true,
        updatedAt: true,
      },
      where: {
        id,
        orgId,
        secret,
      },
    });
  }

  async create(
    orgId: number,
    createSessionDto: CreateSessionDto,
  ): Promise<Session | null> {
    await this.organizationsService.assertFeatureEnabled(orgId, 'sessions');

    const result = await this.sessionsRepository.insert({
      name: createSessionDto.name,
      orgId,
    });
    const sessionId = result.raw[0].id;

    return this.findOne(orgId, sessionId);
  }

  async update(
    orgId: number,
    id: number,
    updateSessionDto: UpdateSessionDto,
  ): Promise<Session> {
    await this.organizationsService.assertFeatureEnabled(orgId, 'sessions');

    const session = await this.sessionsRepository.findOneBy({ id, orgId });
    if (!session) {
      throw new NotFoundException();
    }

    if (!session.default) {
      session.name = updateSessionDto.name;
    }
    // An omitted field keeps its stored value.
    if (updateSessionDto.language !== undefined) {
      session.language = updateSessionDto.language;
    }
    if (updateSessionDto.theme !== undefined) {
      session.theme = updateSessionDto.theme;
    }

    const result = await this.sessionsRepository.save(session);
    return result as Session;
  }

  async delete(orgId: number, id: number): Promise<void> {
    await this.organizationsService.assertFeatureEnabled(orgId, 'sessions');

    const theme = await this.sessionsRepository.findOneBy({ id, orgId });
    if (!theme) {
      throw new NotFoundException();
    }

    if (theme.default) {
      throw new BadRequestException('Cannot delete default session');
    }

    await this.sessionsRepository.delete(id);
  }

  async findOneInAnyOrg(id: number, user: User): Promise<SessionWithRole> {
    const userOrgs = await this.usersService.findUserOrganizations(user.id);
    const userOrgIds = membershipOrgIds(userOrgs);

    const session = await this.sessionsRepository.findOne({
      select: {
        id: true,
        orgId: true,
        name: true,
        language: true,
        theme: true,
        secret: true,
        default: true,
        schedule: true,
        scheduleItem: true,
        selection: true,
        updatedAt: true,
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

    if (!session) {
      throw new NotFoundException();
    }

    await this.assertFeatureEnabledForOrg(session.orgId);

    return withOrganizationRole(session, userOrgs);
  }

  private async assertFeatureEnabledForOrg(orgId: number): Promise<void> {
    const featureEnabled =
      await this.organizationsService.isFeatureEnabledInOrg(orgId, 'sessions');
    if (!featureEnabled) {
      throw new ForbiddenException(
        'Sessions are disabled for this organization',
      );
    }
  }

  async search(
    searchDto: SearchSessionDto,
    user: User,
  ): Promise<SessionWithRole[]> {
    const userOrgs = await this.usersService.findUserOrganizations(user.id);
    // Only include orgs where the user is a member or above. Guests must not see
    // sessions in the cross-org listing — this mirrors the role checks on the
    // per-org session endpoints (see SessionsController).
    const memberOrgIds = userOrgs
      .filter((org) => isRoleHigherOrEqualThan(org.role, 'member'))
      .map((org) => org.organization.id);

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

    // Exclude organizations which disabled the sessions feature
    const orgFeaturesById = new Map(
      userOrgs.map((org) => [
        org.organization.id,
        org.organization.disabledFeatures,
      ]),
    );
    orgIds = orgIds.filter((orgId) =>
      isFeatureEnabled(orgFeaturesById.get(orgId), 'sessions'),
    );

    if (orgIds.length === 0) {
      return [];
    }

    const pageSize = searchDto.itemsPerPage ?? 20;
    const page = searchDto.page ?? 1;

    const sessions = await this.sessionsRepository.find({
      select: {
        id: true,
        orgId: true,
        name: true,
        secret: true,
        language: true,
        theme: true,
        default: true,
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
        default: 'desc',
        name: 'asc',
      },
      skip: pageSize * (page - 1),
      take: pageSize,
    });

    return sessions.map((session) => withOrganizationRole(session, userOrgs));
  }

  async findAllForUserOrgs(user: User): Promise<SessionWithRole[]> {
    const userOrgs = await this.usersService.findUserOrganizations(user.id);
    // Only include orgs where the user is a member or above. Guests must not see
    // sessions in the cross-org listing — this mirrors the role checks on the
    // per-org session endpoints (see SessionsController).
    const userOrgIds = userOrgs
      .filter(
        (org) =>
          isRoleHigherOrEqualThan(org.role, 'member') &&
          isFeatureEnabled(org.organization?.disabledFeatures, 'sessions'),
      )
      .map((org) => org.organization.id);

    if (userOrgIds.length === 0) {
      return [];
    }

    const sessions = await this.sessionsRepository.find({
      select: {
        id: true,
        orgId: true,
        name: true,
        secret: true,
        language: true,
        theme: true,
        default: true,
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

    return sessions.map((session) => withOrganizationRole(session, userOrgs));
  }
}
