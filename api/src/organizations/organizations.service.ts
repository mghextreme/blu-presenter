import { Inject, Injectable, Scope } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CreateOrganizationDto,
  InviteMemberDto,
  UpdateOrganizationDto,
} from 'src/types';
import {
  Organization,
  OrganizationInvitation,
  OrganizationUser,
} from 'src/entities';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';

type Role = 'owner' | 'admin' | 'member';

@Injectable({ scope: Scope.REQUEST })
export class OrganizationsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {}

  async userRole(orgId: number, userId: number): Promise<Role | null> {
    const orgUserRecord = this.organizationUsersRepository.findOneBy({
      orgId,
      userId,
    });

    if (!orgUserRecord) return null;

    return (await orgUserRecord).role;
  }

  async findOne(id: number): Promise<Organization | null> {
    const query = {
      where: { id },
      relations: {
        owner: true,
      },
      select: {
        id: true,
        name: true,
        owner: {
          id: true,
          name: true,
        },
      },
    };

    switch (this.request.user['role']) {
      case 'owner':
      case 'admin':
        query.relations['users'] = {
          user: true,
        };
        query.select['users'] = {
          role: true,
          user: {
            id: true,
            name: true,
            email: true,
          },
        };
        break;
    }

    return await this.organizationsRepository.findOne(query);
  }

  async create(
    createOrgDto: CreateOrganizationDto,
    userId: number,
  ): Promise<Organization> {
    let orgId: number;

    await this.dataSource.transaction(async (manager) => {
      const organizationsRepository = manager.getRepository(Organization);

      const result = await organizationsRepository.insert({
        name: createOrgDto.name,
        ownerId: userId,
      });
      orgId = result.raw[0].id;

      const organizationUsersRepository =
        manager.getRepository(OrganizationUser);
      await organizationUsersRepository.insert({
        orgId,
        userId: userId,
        role: 'owner',
      });
    });

    return this.findOne(orgId);
  }

  async update(
    id: number,
    updateOrgDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.organizationsRepository.findOneBy({ id });
    organization.name = updateOrgDto.name;

    const result = await this.organizationsRepository.save(organization);
    return result as Organization;
  }

  async inviteMember(
    id: number,
    inviteMemberDto: InviteMemberDto,
  ): Promise<OrganizationInvitation> {
    // TODO
    return {
      orgId: id,
      inviterId: this.request.user['internal'].id,
      email: inviteMemberDto.email,
      role: inviteMemberDto.role,
      organization: null,
      inviter: null,
    } as OrganizationInvitation;
  }

  async removeInvitation(id: number, invitationId: number): Promise<void> {
    // TODO
    return;
  }

  async removeMember(id: number, memberId: number): Promise<void> {
    // TODO
    return;
  }
}
