import { IsEmail, IsNotEmpty } from 'class-validator';
import { OrganizationRoleOptions } from './organization-role.type';

export class InviteMemberDto {
  @IsEmail()
  email: string;

  @IsNotEmpty()
  role: OrganizationRoleOptions;
}
