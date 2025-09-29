import { Inject, Injectable, NotFoundException, Scope, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { OrganizationUser, Session } from 'src/entities';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';
import { UsersService } from 'src/users/users.service';
import { OrganizationsService } from 'src/organizations/organizations.service';
import { CreateSessionDto, UpdateSessionDto } from 'src/types';


export class SessionsService {
  constructor(
    @InjectRepository(Session) protected readonly sessionsRepository: Repository<Session>,
    @Inject(OrganizationsService) protected readonly organizationsService: OrganizationsService,
    @Inject(UsersService) protected readonly usersService: UsersService,
  ) {}

  async findOne(orgId: number, id: number): Promise<Session | null> {
    return this.sessionsRepository.findOne({
      select: {
        id: true,
        orgId: true,
        name: true,
        schedule: true,
        scheduleItem: true,
        selection: true,
        updatedAt: true,
      },
      where: {
        id,
        orgId,
      },
    });
  }

  async setSchedule(orgId: number, id: number, schedule: any[]): Promise<void> {
    const result = await this.sessionsRepository.update({ id, orgId }, { schedule });
    if (!result.affected) {
      throw new NotFoundException();
    }
  }

  async setScheduleItem(orgId: number, id: number, scheduleItem: any): Promise<void> {
    const result = await this.sessionsRepository.update({ id, orgId }, { scheduleItem });
    if (!result.affected) {
      throw new NotFoundException();
    }
  }

  async setSelection(orgId: number, id: number, selection: any): Promise<void> {
    const result = await this.sessionsRepository.update({ id, orgId }, { selection });
    if (!result.affected) {
      throw new NotFoundException();
    }
  }

  async findAll(orgId: number): Promise<Session[]> {
    return this.sessionsRepository.find({
      select: {
        id: true,
        name: true,
        secret: true,
      },
      where: {
        orgId,
      },
      order: {
        name: 'asc',
      },
    });
  }

  async findOneBySecret(id: number, secret: string) {
    return this.sessionsRepository.findOne({
      select: {
        id: true,
        name: true,
        schedule: true,
        scheduleItem: true,
        selection: true,
        updatedAt: true,
      },
      where: {
        id,
        secret,
      }
    });
  }

  async create(orgId: number, createSessionDto: CreateSessionDto): Promise<Session> {
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

    session.name = updateSessionDto.name;

    const result = await this.sessionsRepository.save(session);
    return result as Session;
  }

  async delete(orgId: number, id: number): Promise<void> {
    const theme = await this.sessionsRepository.findOneBy({ id, orgId });
    if (!theme) {
      throw new NotFoundException();
    }

    await this.sessionsRepository.delete(id);
  }
}

@Injectable({ scope: Scope.REQUEST })
export class SessionsServiceWithRequest extends SessionsService {
  constructor(
    @InjectRepository(Session) protected readonly sessionsRepository: Repository<Session>,
    @Inject(OrganizationsService) protected readonly organizationsService: OrganizationsService,
    @Inject(UsersService) protected readonly usersService: UsersService,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {
    super(sessionsRepository, organizationsService, usersService);
  }

  async findAllForUserOrgs(): Promise<Session[] | null> {
    let userOrgs: Partial<OrganizationUser>[] = [];
    let userOrgIds: number[] = [];

    if (this.request.user === undefined) {
      throw new UnauthorizedException();
    }

    const user = this.request.user['internal'];
    userOrgs = await this.usersService.findUserOrganizations(user.id);
    userOrgIds = userOrgs.map((org) => org.organization.id);

    return await this.sessionsRepository.find({
      select: {
        id: true,
        name: true,
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
}
