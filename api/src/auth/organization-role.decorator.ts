import { SetMetadata } from '@nestjs/common';

type OrganizationRole = 'owner' | 'admin' | 'member';
export const ORGANIZATION_ROLE_KEY = 'organizationRole';
export const OrganizationRole = (...roles: OrganizationRole[]) =>
  SetMetadata(ORGANIZATION_ROLE_KEY, roles);
