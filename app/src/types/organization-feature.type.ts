export type OrganizationFeature = 'schedules' | 'sessions' | 'themes';

export const ORGANIZATION_FEATURES = [
  'schedules',
  'sessions',
  'themes',
] as OrganizationFeature[];

/** A feature is enabled unless the organization explicitly disabled it. */
export const isFeatureEnabled = (
  disabledFeatures: unknown,
  feature: OrganizationFeature
): boolean =>
  !Array.isArray(disabledFeatures) || !disabledFeatures.includes(feature)

/** Returns the organizations for which the given feature is enabled. */
export function filterOrganizationsByFeature<
  T extends { disabledFeatures?: OrganizationFeature[] }
>(organizations: T[], feature: OrganizationFeature): T[] {
  return organizations.filter((org) =>
    isFeatureEnabled(org.disabledFeatures, feature)
  )
}
