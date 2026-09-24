import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ILike, In, Repository } from 'typeorm';
import { OrganizationUser, Session } from 'src/entities';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';
import { UsersService } from 'src/users/users.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import {
  CreateSessionDto,
  OrganizationRoleOptions,
  SearchSessionDto,
  UpdateSessionDto,
} from 'src/types';
import { isRoleHigherOrEqualThan } from 'src/types/organization-role.type';

type SessionWithRole = Session & {
  organization: {
    id: number;
    name: string;
    role?: OrganizationRoleOptions;
  };
};

@Injectable()
export class SessionsService {
  constructor(
    @InjectRepository(Session)
    protected readonly sessionsRepository: Repository<Session>,
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
  ): Promise<Session> {
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
    const session = await this.sessionsRepository.findOneBy({ id, orgId });
    if (!session) {
      throw new NotFoundException();
    }

    if (!session.default) {
      session.name = updateSessionDto.name;
    }
    session.language = updateSessionDto.language;
    session.theme = updateSessionDto.theme;

    const result = await this.sessionsRepository.save(session);
    return result as Session;
  }

  async delete(orgId: number, id: number): Promise<void> {
    const theme = await this.sessionsRepository.findOneBy({ id, orgId });
    if (!theme) {
      throw new NotFoundException();
    }

    if (theme.default) {
      throw new BadRequestException('Cannot delete default session');
    }

    await this.sessionsRepository.delete(id);
  }
}

@Injectable({ scope: Scope.REQUEST })
export class SessionsServiceWithRequest extends SessionsService {
  constructor(
    @InjectRepository(Session)
    protected readonly sessionsRepository: Repository<Session>,
    @Inject(OrganizationsService)
    protected readonly organizationsService: OrganizationsService,
    @Inject(UsersService) protected readonly usersService: UsersService,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {
    super(sessionsRepository);
  }

  private async getUserOrgs(): Promise<Partial<OrganizationUser>[]> {
    if (this.request.user === undefined) {
      throw new UnauthorizedException();
    }

    const user = this.request.user['internal'];
    return await this.usersService.findUserOrganizations(user.id);
  }

  async findOneInAnyOrg(id: number): Promise<SessionWithRole> {
    const userOrgs = await this.getUserOrgs();
    const userOrgIds = userOrgs.map((org) => org.organization.id);

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

    const orgUser = userOrgs.find(
      (org) => org.organization.id === session.orgId,
    );
    return {
      ...session,
      organization: orgUser
        ? {
            ...orgUser.organization,
            role: orgUser.role as OrganizationRoleOptions,
          }
        : {
            ...session.organization,
            role: undefined,
          },
    } as SessionWithRole;
  }

  async search(searchDto: SearchSessionDto): Promise<Session[]> {
    const userOrgs = await this.getUserOrgs();
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

    if (orgIds.length === 0) {
      return [];
    }

    const pageSize = searchDto.itemsPerPage ?? 20;
    const page = searchDto.page ?? 1;

    const sessions = await this.sessionsRepository.find({
      select: {
        id: true,
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

    const userOrgsMap: { [key: number]: Partial<OrganizationUser> } = {};
    for (const org of userOrgs) {
      userOrgsMap[org.organization.id] = org;
    }

    return sessions.map((session) => {
      const orgUser = userOrgsMap[session.orgId];
      return {
        ...session,
        organization: orgUser
          ? {
              ...orgUser.organization,
              role: orgUser.role as OrganizationRoleOptions,
            }
          : {
              ...session.organization,
              role: undefined,
            },
      } as SessionWithRole;
    });
  }

  async findAllForUserOrgs(): Promise<Session[] | null> {
    const userOrgs = await this.getUserOrgs();
    // Only include orgs where the user is a member or above. Guests must not see
    // sessions in the cross-org listing — this mirrors the role checks on the
    // per-org session endpoints (see SessionsController).
    const userOrgIds = userOrgs
      .filter((org) => isRoleHigherOrEqualThan(org.role, 'member'))
      .map((org) => org.organization.id);

    if (userOrgIds.length === 0) {
      return [];
    }

    return await this.sessionsRepository.find({
      select: {
        id: true,
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
  }
}
