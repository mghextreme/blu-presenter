import {
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  NotImplementedException,
  Scope,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import {
  AuthInvitationDataDto,
  CreateOrganizationDto,
  EditMemberDto,
  InviteMemberDto,
  isRoleHigherOrEqualThan,
  isRoleHigherThan,
  OrganizationRoleOptions,
  UpdateOrganizationDto,
} from 'src/types';
import {
  Organization,
  OrganizationInvitation,
  OrganizationUser,
  User,
} from 'src/entities';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';

@Injectable({ scope: Scope.REQUEST })
export class OrganizationsService {
  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Organization)
    private readonly organizationsRepository: Repository<Organization>,
    @InjectRepository(OrganizationUser)
    private readonly organizationUsersRepository: Repository<OrganizationUser>,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(OrganizationInvitation)
    private readonly organizationInvitationsRepository: Repository<OrganizationInvitation>,
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

    const orgs = await this.organizationsRepository.find(query);
    if (orgs.length === 0) {
      throw new NotFoundException('Organization not found');
    }
    return orgs[0];
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

  async transferOwnership(toUserId: number): Promise<void> {
    if (this.request.user['role'] !== 'owner') {
      throw new ForbiddenException();
    }

    const organization = this.request.user['organization'];
    const ownerUser = this.request.user['internal'];

    await this.dataSource.transaction(async (manager) => {
      const organizationsRepository =
        manager.getRepository(Organization);
      const organizationUsersRepository =
        manager.getRepository(OrganizationUser);

      const promoteNewOwner = await organizationUsersRepository.update(
        {
          orgId: organization,
          userId: toUserId,
        },
        {
          role: 'owner',
        },
      );
      
      if (promoteNewOwner.affected < 1) {
        throw new NotFoundException('User not found in organization');
      }

      await organizationUsersRepository.update(
        {
          orgId: organization,
          userId: ownerUser.id,
        },
        {
          role: 'admin',
        },
      );

      await organizationsRepository.update({
        id: organization,
      }, {
        ownerId: toUserId,
      });
    });
  }

  async delete(id: number): Promise<void> {
    if (this.request.user['role'] !== 'owner') {
      throw new ForbiddenException();
    }

    // TODO: Prevent removing if is the only organization for the user (personal space)

    // TODO: Transaction
    // TODO: Delete organization invitations
    // TODO: Delete organization users
    // TODO: Delete songs

    throw new NotImplementedException(
      'Deleting organizations is not implemented yet',
    );

    // await this.organizationsRepository.delete(id);
  }

  async getMember(orgId: number, id: number): Promise<OrganizationUser> {
    const member = await this.organizationUsersRepository.findOne({
      where: {
        userId: id,
        orgId: orgId,
      },
      relations: {
        user: true,
      },
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    return member;
  }

  async editMember(
    id: number,
    memberId: number,
    editMemberDto: EditMemberDto,
  ): Promise<void> {
    const member = await this.organizationUsersRepository.findOneBy({
      orgId: id,
      userId: memberId,
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner') {
      throw new UnprocessableEntityException(
        'You cannot change the role of the owner',
      );
    }

    if (isRoleHigherOrEqualThan(editMemberDto.role, this.request.user['role'])) {
      throw new ForbiddenException(
        `You cannot change this members role because your role is ${this.request.user['role']}`,
      );
    }

    await this.organizationUsersRepository.update(
      {
        orgId: id,
        userId: memberId,
      },
      {
        role: editMemberDto.role,
      },
    );
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

    if (inviteMemberDto.role === 'owner') {
      throw new UnprocessableEntityException('Invalid role for invitation');
    }

    if (isRoleHigherThan(inviteMemberDto.role, this.request.user['role'])) {
      throw new ForbiddenException(
        `You cannot invite a user with role ${inviteMemberDto.role} because your role is ${this.request.user['role']}`,
      );
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

  async getInvitation(
    id: number,
    secret: string,
  ): Promise<OrganizationInvitation> {
    return await this.organizationInvitationsRepository.findOne({
      where: {
        id,
        secret,
      },
      relations: {
        organization: true,
      },
    });
  }

  async getInvitationsForEmail(
    email: string,
  ): Promise<OrganizationInvitation[]> {
    return await this.organizationInvitationsRepository.find({
      where: {
        email,
      },
      relations: {
        organization: true,
      },
    });
  }

  async acceptInvitation(id: number): Promise<OrganizationInvitation> {
    const invitation = await this.organizationInvitationsRepository.findOneBy({
      id: id,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const user = this.request.user['internal'] as User;
    if (user.email !== invitation.email) {
      throw new ForbiddenException('You cannot accept this invitation');
    }

    await this.internalAssociateInvite(invitation, user);

    return invitation;
  }

  async associateInvite(userAuthId: string, invite: AuthInvitationDataDto): Promise<OrganizationInvitation> {
    const invitation = await this.organizationInvitationsRepository.findOneBy({
      id: invite.id,
      secret: invite.secret,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const user = await this.usersRepository.findOneBy({
      authId: userAuthId,
    })

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.internalAssociateInvite(invitation, user);

    return invitation;
  }

  private async internalAssociateInvite(invitation: OrganizationInvitation, user: User) {
    const existingOrgUser = await this.organizationUsersRepository.findOneBy({
      orgId: invitation.orgId,
      userId: user.id,
    });

    if (existingOrgUser) {
      await this.dataSource.transaction(async (manager) => {
        if (isRoleHigherThan(invitation.role, existingOrgUser.role)) {
          const organizationUsersRepository =
            manager.getRepository(OrganizationUser);
          await organizationUsersRepository.update(
            {
              orgId: invitation.orgId,
              userId: user.id,
            },
            {
              role: invitation.role,
            },
          );
        }

        const organizationInvitationsRepository = manager.getRepository(
          OrganizationInvitation,
        );
        await organizationInvitationsRepository.delete(invitation.id);
      });
      return;
    }

    await this.dataSource.transaction(async (manager) => {
      const organizationUsersRepository =
        manager.getRepository(OrganizationUser);
      await organizationUsersRepository.insert({
        orgId: invitation.orgId,
        userId: user.id,
        role: invitation.role,
      });

      const organizationInvitationsRepository = manager.getRepository(
        OrganizationInvitation,
      );
      await organizationInvitationsRepository.delete(invitation.id);
    });
  }

  async rejectInvitation(id: number): Promise<void> {
    const invitation = await this.organizationInvitationsRepository.findOneBy({
      id: id,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const user = this.request.user['internal'];
    if (user.email !== invitation.email) {
      throw new ForbiddenException('You cannot accept this invitation');
    }
    await this.organizationInvitationsRepository.delete(id);
  }

  async removeInvitation(id: number, invitationId: number): Promise<void> {
    const invitation = await this.organizationInvitationsRepository.findOneBy({
      id: invitationId,
      orgId: id,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    await this.organizationInvitationsRepository.delete(invitationId);
  }

  async removeMember(id: number, memberId: number): Promise<void> {
    const member = await this.organizationUsersRepository.findOneBy({
      userId: memberId,
      orgId: id,
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (
      isRoleHigherOrEqualThan(member.role, this.request.user['role'])
    ) {
      throw new UnprocessableEntityException(
        'You cannot remove this member from the organization',
      );
    }

    await this.organizationUsersRepository.delete({
      userId: memberId,
      orgId: id,
    });
  }
}
