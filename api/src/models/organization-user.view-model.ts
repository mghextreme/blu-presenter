import { OrganizationFeature, OrganizationRoleOptions } from 'src/types';

export interface OrganizationUserViewModel {
  id: number;
  /** Optional so that personal spaces (organizations without a name) map correctly. */
  name?: string;
  role: OrganizationRoleOptions;
  disabledFeatures?: OrganizationFeature[];
}
