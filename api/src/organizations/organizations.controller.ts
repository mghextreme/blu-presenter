import {
  Body,
  Controller,
  Delete,
  Get,
  Inject,
  Param,
  Post,
  Put,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import {
  Organization,
  OrganizationInvitation,
  OrganizationUser,
} from 'src/entities';
import {
  CreateOrganizationDto,
  EditMemberDto,
  InviteMemberDto,
  OrganizationViewModel,
  UpdateOrganizationDto,
} from 'src/types';
import { OrganizationsService } from './organizations.service';
import { OrganizationRole } from '../auth/organization-role.decorator';
import { REQUEST } from '@nestjs/core';
import { Request as ExpRequest } from 'express';
import { Public } from 'src/supabase/public.decorator';

@Controller('organizations')
export class OrganizationsController {
  constructor(
    private organizationsService: OrganizationsService,
    @Inject(REQUEST) private readonly request: ExpRequest,
  ) {}

  @Get('self')
  @OrganizationRole('owner', 'admin', 'member')
  async findSelf(): Promise<OrganizationViewModel> {
    const usersOrg = this.request.user['organization'];
    const org = await this.organizationsService.findOne(usersOrg);
    return new OrganizationViewModel(org, this.request.user['role']);
  }

  @Post()
  async create(
    @Body() createOrganizationDto: CreateOrganizationDto,
  ): Promise<Organization> {
    const user = this.request.user['internal'];
    return await this.organizationsService.create(
      createOrganizationDto,
      user.id,
    );
  }

  @Put('self')
  @OrganizationRole('owner', 'admin')
  async update(
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    const usersOrg = this.request.user['organization'];
    return await this.organizationsService.update(
      usersOrg,
      updateOrganizationDto,
    );
  }

  @Delete()
  @OrganizationRole('owner')
  async delete(): Promise<void> {
    const usersOrg = this.request.user['organization'];
    return await this.organizationsService.delete(usersOrg);
  }

  @Get('members/:id')
  @OrganizationRole('owner', 'admin', 'member')
  async getMember(@Param('id') id: number): Promise<OrganizationUser> {
    const usersOrg = this.request.user['organization'];
    return await this.organizationsService.getMember(usersOrg, id);
  }

  @Post('members')
  @OrganizationRole('owner', 'admin')
  async inviteMember(
    @Body() inviteMemberDto: InviteMemberDto,
  ): Promise<OrganizationInvitation> {
    const usersOrg = this.request.user['organization'];
    return await this.organizationsService.inviteMember(
      usersOrg,
      inviteMemberDto,
    );
  }

  @Put('members/:id')
  @OrganizationRole('owner', 'admin')
  async editMember(
    @Param('id') id: number,
    @Body() editMemberDto: EditMemberDto,
  ): Promise<void> {
    const usersOrg = this.request.user['organization'];
    const userId = this.request.user['internal'].id;

    if (userId === id) {
      throw new UnprocessableEntityException(
        'You cannot edit your own role in an organization',
      );
    }

    await this.organizationsService.editMember(usersOrg, id, editMemberDto);
  }

  @Post('leave')
  @OrganizationRole('admin', 'member')
  async leaveOrganization(): Promise<void> {
    const usersOrg = this.request.user['organization'];
    const user = this.request.user['internal'];
    return await this.organizationsService.removeMember(usersOrg, user.id);
  }

  @Public()
  @Get('invitations/:id')
  async getInvitation(
    @Param('id') id: number,
    @Query('secret') secret: string,
  ): Promise<OrganizationInvitation> {
    return await this.organizationsService.getInvitation(id, secret);
  }

  @Get('invitations')
  async getInvitations(): Promise<OrganizationInvitation[]> {
    const user = this.request.user['internal'];
    return await this.organizationsService.getInvitationsForEmail(user.email);
  }

  @Post('invitations/:id/accept')
  async acceptInvitation(@Param('id') id: number): Promise<void> {
    await this.organizationsService.acceptInvitation(id);
  }

  @Post('invitations/:id/reject')
  async rejectInvitation(@Param('id') id: number): Promise<void> {
    return await this.organizationsService.rejectInvitation(id);
  }

  @Delete('invitations/:id')
  @OrganizationRole('owner', 'admin')
  async removeInvitation(@Param('id') id: number): Promise<void> {
    const usersOrg = this.request.user['organization'];
    return await this.organizationsService.removeInvitation(usersOrg, id);
  }

  @Delete('members/:id')
  @OrganizationRole('owner', 'admin')
  async removeMember(@Param('id') id: number): Promise<void> {
    const usersOrg = this.request.user['organization'];
    const userId = this.request.user['internal'].id;

    if (userId === id) {
      throw new UnprocessableEntityException(
        'You cannot remove yourself from the organization',
      );
    }

    return await this.organizationsService.removeMember(usersOrg, id);
  }
}
