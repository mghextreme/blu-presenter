import { IsNotEmpty } from 'class-validator';
import { OrganizationRoleOptions } from './organization-role.type';

export class EditMemberDto {
  @IsNotEmpty()
  role: OrganizationRoleOptions;
}
