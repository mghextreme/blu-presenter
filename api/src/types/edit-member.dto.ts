import { IsIn } from 'class-validator';
import {
  ORGANIZATION_ROLES,
  OrganizationRoleOptions,
} from './organization-role.type';

export class EditMemberDto {
  @IsIn(ORGANIZATION_ROLES)
  role: OrganizationRoleOptions;
}
