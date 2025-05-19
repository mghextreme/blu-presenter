import { OrganizationRoleOptions } from './organization-role.type';

export class InviteMemberDto {
  email: string;
  role: OrganizationRoleOptions;
}
