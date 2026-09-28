export type OrganizationFeature = 'schedules' | 'sessions' | 'themes';

export const ORGANIZATION_FEATURES = [
  'schedules',
  'sessions',
  'themes',
] as OrganizationFeature[];

export const isFeatureEnabled = (
  disabledFeatures: unknown,
  feature: OrganizationFeature,
): boolean =>
  !Array.isArray(disabledFeatures) || !disabledFeatures.includes(feature);

export const ORGANIZATION_FEATURE_LABELS: Record<OrganizationFeature, string> =
  {
    schedules: 'Schedules',
    sessions: 'Sessions',
    themes: 'Themes',
  };
