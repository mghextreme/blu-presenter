import {
  ForbiddenException,
  Inject,
  Injectable,
  Scope,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  CreateOrganizationDto,
  InviteMemberDto,
  OrganizationRoleOptions,
  UpdateOrganizationDto,
} from 'src/types';
import {
  Organization,
  OrganizationInvitation,
  OrganizationUser,
} from 'src/entities';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class OrganizationsService {
  constructor(
    private dataSource: DataSource,
    @InjectRepository(Organization)
    private organizationsRepository: Repository<Organization>,
    @InjectRepository(OrganizationUser)
    private organizationUsersRepository: Repository<OrganizationUser>,
    @InjectRepository(OrganizationInvitation)
    private organizationInvitationsRepository: Repository<OrganizationInvitation>,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {}

  async userRole(
    orgId: number,
    userId: number,
  ): Promise<OrganizationRoleOptions | null> {
    const orgUserRecord = await this.organizationUsersRepository.findOneBy({
      orgId,
      userId,
    });

    if (!orgUserRecord) return null;

    return orgUserRecord.role;
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
        query.relations['invitations'] = {
          inviter: true,
        };

        query.select['users'] = {
          role: true,
          user: {
            id: true,
            name: true,
            email: true,
          },
        };
        query.select['invitations'] = {
          id: true,
          orgId: true,
          email: true,
          role: true,
          secret: true,
          inviter: {
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

  async delete(id: number): Promise<void> {
    if (this.request.user['role'] !== 'owner') {
      throw new ForbiddenException();
    }

    // TODO: Transaction
    // TODO: Delete organization invitations
    // TODO: Delete organization users
    // TODO: Delete songs
    await this.organizationsRepository.delete(id);
  }

  async inviteMember(
    id: number,
    inviteMemberDto: InviteMemberDto,
  ): Promise<OrganizationInvitation> {
    const emailToInvite = inviteMemberDto.email.toLowerCase();
    const existingInvitation =
      await this.organizationInvitationsRepository.findOneBy({
        orgId: id,
        email: emailToInvite,
      });

    if (existingInvitation) {
      throw new UnprocessableEntityException('User already invited');
    }

    await this.organizationInvitationsRepository.insert({
      orgId: id,
      inviterId: this.request.user['internal'].id,
      email: inviteMemberDto.email,
      role: inviteMemberDto.role,
      secret: this.createSecret(),
    });

    return (await this.organizationInvitationsRepository.findOneBy({
      orgId: id,
      email: inviteMemberDto.email,
    })) as OrganizationInvitation;
  }

  private createSecret(): string {
    const sec1 = Math.random().toString(36);
    const sec2 = Math.random().toString(36);
    const secString = sec1 + sec2;
    return Buffer.from(secString, 'utf-8')
      .toString('base64')
      .replaceAll('=', '');
  }

  async removeInvitation(id: number, invitationId: number): Promise<void> {
    // TODO
    return;
  }

  async removeMember(id: number, memberId: number): Promise<void> {
    // TODO: Remove users invited by this user
    return;
  }
}
