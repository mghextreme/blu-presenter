import { IsEmail, IsIn } from 'class-validator';
import {
  ORGANIZATION_ROLES,
  OrganizationRoleOptions,
} from './organization-role.type';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsIn(ORGANIZATION_ROLES)
  role: OrganizationRoleOptions;
}
