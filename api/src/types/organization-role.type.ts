export type OrganizationRoleOptions = 'owner' | 'admin' | 'member';

export const isRoleHigherThan = (
  role: OrganizationRoleOptions,
  compareTo: OrganizationRoleOptions,
): boolean => {
  const roles = ['owner', 'admin', 'member'];
  return roles.indexOf(role) < roles.indexOf(compareTo);
};

export const isRoleHigherOrEqualThan = (
  role: OrganizationRoleOptions,
  compareTo: OrganizationRoleOptions,
): boolean => {
  const roles = ['owner', 'admin', 'member'];
  return roles.indexOf(role) <= roles.indexOf(compareTo);
};
