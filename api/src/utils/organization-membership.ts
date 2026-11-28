import { OrganizationMembership, OrganizationRoleOptions } from 'src/types';

export type WithOrganizationRole<T> = Omit<T, 'organization'> & {
  organization: {
    id?: number;
    name?: string | null;
    role?: OrganizationRoleOptions;
  };
};

/**
 * Returns the entity with its organization annotated with the user's role in
 * it, taken from `memberships`. Entities of organizations the user does not
 * belong to (public or shared by secret) get no role.
 */
export function withOrganizationRole<
  T extends {
    orgId: number | null;
    organization?: { id: number; name: string | null } | null;
  },
>(entity: T, memberships: OrganizationMembership[]): WithOrganizationRole<T> {
  const membership = memberships.find(
    (item) => item.organization.id === entity.orgId,
  );
  return {
    ...entity,
    organization: membership
      ? { ...membership.organization, role: membership.role }
      : { ...entity.organization, role: undefined },
  };
}

export function membershipOrgIds(
  memberships: OrganizationMembership[],
): number[] {
  return memberships.map((membership) => membership.organization.id);
}
