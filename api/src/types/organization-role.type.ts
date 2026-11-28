/** Highest first. */
export const ORGANIZATION_ROLES = [
  'owner',
  'admin',
  'member',
  'guest',
] as const;

export type OrganizationRoleOptions = (typeof ORGANIZATION_ROLES)[number];

const roles: readonly OrganizationRoleOptions[] = ORGANIZATION_ROLES;

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
