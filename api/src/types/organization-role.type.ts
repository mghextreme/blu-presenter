export type OrganizationRoleOptions = 'owner' | 'admin' | 'member' | 'guest';

const roles = ['owner', 'admin', 'member', 'guest'];

export const isRoleHigherThan = (
  role: OrganizationRoleOptions | undefined,
  compareTo: OrganizationRoleOptions,
): boolean => {
  if (!role) return false;
  return roles.indexOf(role) < roles.indexOf(compareTo);
};

export const isRoleHigherOrEqualThan = (
  role: OrganizationRoleOptions | undefined,
  compareTo: OrganizationRoleOptions,
): boolean => {
  if (!role) return false;
  return roles.indexOf(role) <= roles.indexOf(compareTo);
};
