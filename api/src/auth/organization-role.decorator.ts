import { SetMetadata } from '@nestjs/common';
import { OrganizationRoleOptions } from 'src/types';

export const ORGANIZATION_ROLE_KEY = 'organizationRole';
export const OrganizationRole = (...roles: OrganizationRoleOptions[]) =>
  SetMetadata(ORGANIZATION_ROLE_KEY, roles);
