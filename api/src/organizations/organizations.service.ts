import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  NotImplementedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, FindOneOptions, Repository } from 'typeorm';
import {
  AuthInvitationDataDto,
  CreateOrganizationDto,
  EditMemberDto,
  InviteMemberDto,
  isFeatureEnabled,
  isRoleHigherOrEqualThan,
  isRoleHigherThan,
  ORGANIZATION_FEATURE_LABELS,
  OrganizationFeature,
  OrganizationRoleOptions,
  UpdateOrganizationDto,
} from 'src/types';

/** The member performing an organization management action. */
export interface OrganizationActor {
  userId: number;
  role: OrganizationRoleOptions;
}
import {
  Organization,
  OrganizationInvitation,
  OrganizationUser,
  User,
} from 'src/entities';
import { generateRandomSecret } from 'src/utils/secret';

@Injectable()
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

  async getDisabledFeatures(orgId: number): Promise<OrganizationFeature[]> {
    const org = await this.organizationsRepository.findOne({
      where: { id: orgId },
      select: { disabledFeatures: true },
    });
    return org?.disabledFeatures ?? [];
  }

  async isFeatureEnabledInOrg(
    orgId: number,
    feature: OrganizationFeature,
  ): Promise<boolean> {
    return isFeatureEnabled(await this.getDisabledFeatures(orgId), feature);
  }

  async assertFeatureEnabled(
    orgId: number,
    feature: OrganizationFeature,
    options: { notFound?: boolean } = {},
  ): Promise<void> {
    if (await this.isFeatureEnabledInOrg(orgId, feature)) return;

    const label = ORGANIZATION_FEATURE_LABELS[feature];
    if (options.notFound) {
      throw new NotFoundException(`${label} not found`);
    }
    throw new ForbiddenException(`${label} are disabled for this organization`);
  }

  /** Members, invitations and the secret are only included for owners and admins. */
  async findOne(
    id: number,
    role: OrganizationRoleOptions,
  ): Promise<Organization> {
    const canManage = role === 'owner' || role === 'admin';
    const query: FindOneOptions<Organization> = {
      where: { id },
      relations: {
        owner: true,
        ...(canManage && {
          users: { user: true },
          invitations: { inviter: true },
        }),
      },
      select: {
        id: true,
        name: true,
        disabledFeatures: true,
        owner: {
          id: true,
          name: true,
        },
        ...(canManage && {
          secret: true,
          users: {
            role: true,
            user: {
              id: true,
              name: true,
              email: true,
            },
          },
          invitations: {
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
          },
        }),
      },
    };

    const organization = await this.organizationsRepository.findOne(query);
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }
    return organization;
  }

  async create(
    createOrgDto: CreateOrganizationDto,
    userId: number,
  ): Promise<Organization> {
    const orgId = await this.dataSource.transaction(async (manager) => {
      const organizationsRepository = manager.getRepository(Organization);

      const result = await organizationsRepository.insert({
        name: createOrgDto.name,
        ownerId: userId,
        secret: generateRandomSecret(16),
      });
      const orgId: number = result.raw[0].id;

      const organizationUsersRepository =
        manager.getRepository(OrganizationUser);
      await organizationUsersRepository.insert({
        orgId,
        userId: userId,
        role: 'owner',
      });

      return orgId;
    });

    return this.findOne(orgId, 'owner');
  }

  async update(
    id: number,
    updateOrgDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const organization = await this.organizationsRepository.findOneBy({ id });
    if (!organization) {
      throw new NotFoundException('Organization not found');
    }

    if (updateOrgDto.name !== undefined) {
      organization.name = updateOrgDto.name;
    }

    if (updateOrgDto.disabledFeatures !== undefined) {
      organization.disabledFeatures = updateOrgDto.disabledFeatures;
    }

    return await this.organizationsRepository.save(organization);
  }

  async transferOwnership(
    orgId: number,
    owner: OrganizationActor,
    toUserId: number,
  ): Promise<void> {
    if (owner.role !== 'owner') {
      throw new ForbiddenException();
    }

    if (Number(toUserId) === owner.userId) {
      throw new UnprocessableEntityException(
        'You already own this organization',
      );
    }

    await this.dataSource.transaction(async (manager) => {
      const organizationsRepository = manager.getRepository(Organization);
      const organizationUsersRepository =
        manager.getRepository(OrganizationUser);

      const promoteNewOwner = await organizationUsersRepository.update(
        {
          orgId,
          userId: toUserId,
        },
        {
          role: 'owner',
        },
      );

      if (!promoteNewOwner.affected) {
        throw new NotFoundException('User not found in organization');
      }

      await organizationUsersRepository.update(
        {
          orgId,
          userId: owner.userId,
        },
        {
          role: 'admin',
        },
      );

      await organizationsRepository.update(
        {
          id: orgId,
        },
        {
          ownerId: toUserId,
        },
      );
    });
  }

  async delete(actorRole: OrganizationRoleOptions): Promise<void> {
    if (actorRole !== 'owner') {
      throw new ForbiddenException();
    }

    // TODO: Prevent removing if is the only organization for the user (personal space)

    // TODO: Transaction
    // TODO: Delete organization invitations
    // TODO: Delete organization users
    // TODO: Delete themes
    // TODO: Delete schedules
    // TODO: Delete songs

    throw new NotImplementedException(
      'Deleting organizations is not implemented yet. Coming soon!',
    );
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
    actorRole: OrganizationRoleOptions,
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

    if (isRoleHigherOrEqualThan(editMemberDto.role, actorRole)) {
      throw new ForbiddenException(
        `You cannot change this members role because your role is ${actorRole}`,
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
    inviter: OrganizationActor,
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

    if (isRoleHigherThan(inviteMemberDto.role, inviter.role)) {
      throw new ForbiddenException(
        `You cannot invite a user with role ${inviteMemberDto.role} because your role is ${inviter.role}`,
      );
    }

    await this.organizationInvitationsRepository.insert({
      orgId: id,
      inviterId: inviter.userId,
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
  ): Promise<OrganizationInvitation | null> {
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
    email: string | null,
  ): Promise<OrganizationInvitation[]> {
    if (!email) {
      return [];
    }

    return await this.organizationInvitationsRepository.find({
      where: {
        email,
      },
      relations: {
        organization: true,
      },
    });
  }

  async acceptInvitation(
    id: number,
    user: User,
  ): Promise<OrganizationInvitation> {
    const invitation = await this.organizationInvitationsRepository.findOneBy({
      id: id,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (user.email !== invitation.email) {
      throw new ForbiddenException('You cannot accept this invitation');
    }

    await this.internalAssociateInvite(invitation, user);

    return invitation;
  }

  async associateInvite(
    userAuthId: string,
    invite: AuthInvitationDataDto,
  ): Promise<OrganizationInvitation> {
    const invitation = await this.organizationInvitationsRepository.findOneBy({
      id: invite.id,
      secret: invite.secret,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    const user = await this.usersRepository.findOneBy({
      authId: userAuthId,
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.internalAssociateInvite(invitation, user);

    return invitation;
  }

  private async internalAssociateInvite(
    invitation: OrganizationInvitation,
    user: User,
  ) {
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

  async rejectInvitation(id: number, user: User): Promise<void> {
    const invitation = await this.organizationInvitationsRepository.findOneBy({
      id: id,
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

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

  /**
   * Removes the calling user from the organization. Owners must transfer
   * ownership first so the organization is never left without one.
   */
  async leave(id: number, userId: number): Promise<void> {
    const member = await this.organizationUsersRepository.findOneBy({
      userId,
      orgId: id,
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (member.role === 'owner') {
      throw new UnprocessableEntityException(
        'Transfer ownership before leaving the organization',
      );
    }

    await this.organizationUsersRepository.delete({
      userId,
      orgId: id,
    });
  }

  async removeMember(
    id: number,
    memberId: number,
    actorRole: OrganizationRoleOptions,
  ): Promise<void> {
    const member = await this.organizationUsersRepository.findOneBy({
      userId: memberId,
      orgId: id,
    });

    if (!member) {
      throw new NotFoundException('Member not found');
    }

    if (isRoleHigherOrEqualThan(member.role, actorRole)) {
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
