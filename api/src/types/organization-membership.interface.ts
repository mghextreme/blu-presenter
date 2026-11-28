import type { Organization } from 'src/entities';
import type { OrganizationRoleOptions } from './organization-role.type';

/** One organization a user belongs to, with their role in it. */
export interface OrganizationMembership {
  role: OrganizationRoleOptions;
  organization: Pick<Organization, 'id' | 'name' | 'disabledFeatures'>;
}
