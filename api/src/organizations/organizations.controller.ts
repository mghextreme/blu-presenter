import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UnprocessableEntityException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  Organization,
  OrganizationInvitation,
  OrganizationUser,
  User,
} from 'src/entities';
import {
  CreateOrganizationDto,
  EditMemberDto,
  InviteMemberDto,
  OrganizationRoleOptions,
  OrganizationViewModel,
  TransferOrganizationDto,
  UpdateOrganizationDto,
} from 'src/types';
import { OrganizationsService } from './organizations.service';
import { OrganizationRole } from '../auth/organization-role.decorator';
import { CurrentUser, OrgId, OrgRole } from '../auth/request-context.decorator';
import { Public } from 'src/supabase/public.decorator';

@Controller('organizations')
@ApiTags('organizations')
@ApiBearerAuth('JWT-auth')
export class OrganizationsController {
  constructor(private organizationsService: OrganizationsService) {}

  @Get('self')
  @OrganizationRole('owner', 'admin', 'member', 'guest')
  async findSelf(
    @OrgId() orgId: number,
    @OrgRole() role: OrganizationRoleOptions,
  ): Promise<OrganizationViewModel> {
    const org = await this.organizationsService.findOne(orgId, role);
    return new OrganizationViewModel(org, role);
  }

  @Post()
  async create(
    @CurrentUser() user: User,
    @Body() createOrganizationDto: CreateOrganizationDto,
  ): Promise<Organization> {
    return await this.organizationsService.create(
      createOrganizationDto,
      user.id,
    );
  }

  @Put('self')
  @OrganizationRole('owner', 'admin')
  async update(
    @OrgId() orgId: number,
    @Body() updateOrganizationDto: UpdateOrganizationDto,
  ): Promise<Organization> {
    return await this.organizationsService.update(orgId, updateOrganizationDto);
  }

  @Delete()
  @OrganizationRole('owner')
  async delete(@OrgRole() role: OrganizationRoleOptions): Promise<void> {
    return await this.organizationsService.delete(role);
  }

  @Get('members/:id')
  @OrganizationRole('owner', 'admin', 'member')
  async getMember(
    @OrgId() orgId: number,
    @Param('id') id: number,
  ): Promise<OrganizationUser> {
    return await this.organizationsService.getMember(orgId, id);
  }

  @Post('members')
  @OrganizationRole('owner', 'admin')
  async inviteMember(
    @OrgId() orgId: number,
    @OrgRole() role: OrganizationRoleOptions,
    @CurrentUser() user: User,
    @Body() inviteMemberDto: InviteMemberDto,
  ): Promise<OrganizationInvitation> {
    return await this.organizationsService.inviteMember(
      orgId,
      inviteMemberDto,
      { userId: user.id, role },
    );
  }

  @Put('members/:id')
  @OrganizationRole('owner', 'admin')
  async editMember(
    @OrgId() orgId: number,
    @OrgRole() role: OrganizationRoleOptions,
    @CurrentUser() user: User,
    @Param('id') id: number,
    @Body() editMemberDto: EditMemberDto,
  ): Promise<void> {
    if (user.id === id) {
      throw new UnprocessableEntityException(
        'You cannot edit your own role in an organization',
      );
    }

    await this.organizationsService.editMember(orgId, id, editMemberDto, role);
  }

  @Post('transferOwnership')
  @OrganizationRole('owner')
  async transferOwnership(
    @OrgId() orgId: number,
    @OrgRole() role: OrganizationRoleOptions,
    @CurrentUser() user: User,
    @Body() transferOrganizationDto: TransferOrganizationDto,
  ): Promise<void> {
    await this.organizationsService.transferOwnership(
      orgId,
      { userId: user.id, role },
      transferOrganizationDto.userId,
    );
  }

  @Post('leave')
  @OrganizationRole('admin', 'member', 'guest')
  async leaveOrganization(
    @OrgId() orgId: number,
    @CurrentUser() user: User,
  ): Promise<void> {
    return await this.organizationsService.leave(orgId, user.id);
  }

  @Public()
  @Get('invitations/:id')
  async getInvitation(
    @Param('id') id: number,
    @Query('secret') secret: string,
  ): Promise<OrganizationInvitation | null> {
    return await this.organizationsService.getInvitation(id, secret);
  }

  @Get('invitations')
  async getInvitations(
    @CurrentUser() user: User,
  ): Promise<OrganizationInvitation[]> {
    return await this.organizationsService.getInvitationsForEmail(user.email);
  }

  @Post('invitations/:id/accept')
  async acceptInvitation(
    @CurrentUser() user: User,
    @Param('id') id: number,
  ): Promise<void> {
    await this.organizationsService.acceptInvitation(id, user);
  }

  @Post('invitations/:id/reject')
  async rejectInvitation(
    @CurrentUser() user: User,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.organizationsService.rejectInvitation(id, user);
  }

  @Delete('invitations/:id')
  @OrganizationRole('owner', 'admin')
  async removeInvitation(
    @OrgId() orgId: number,
    @Param('id') id: number,
  ): Promise<void> {
    return await this.organizationsService.removeInvitation(orgId, id);
  }

  @Delete('members/:id')
  @OrganizationRole('owner', 'admin')
  async removeMember(
    @OrgId() orgId: number,
    @OrgRole() role: OrganizationRoleOptions,
    @CurrentUser() user: User,
    @Param('id') id: number,
  ): Promise<void> {
    if (user.id === id) {
      throw new UnprocessableEntityException(
        'You cannot remove yourself from the organization',
      );
    }

    return await this.organizationsService.removeMember(orgId, id, role);
  }
}
