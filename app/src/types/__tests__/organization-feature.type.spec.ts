import { describe, it, expect } from 'vitest'
import {
  filterOrganizationsByFeature,
  isFeatureEnabled,
  type OrganizationFeature,
} from '../organization-feature.type'

describe('isFeatureEnabled', () => {
  it.each(['schedules', 'sessions', 'themes'] as OrganizationFeature[])(
    'should be enabled by default when no features are disabled (%s)',
    (feature) => {
      expect(isFeatureEnabled(undefined, feature)).toBe(true)
      expect(isFeatureEnabled(null, feature)).toBe(true)
      expect(isFeatureEnabled([], feature)).toBe(true)
    }
  )

  it('should be disabled when the feature is listed in disabledFeatures', () => {
    expect(isFeatureEnabled(['sessions'], 'sessions')).toBe(false)
  })

  it('should remain enabled when another feature is disabled', () => {
    expect(isFeatureEnabled(['sessions'], 'themes')).toBe(true)
  })

  it('should treat non-array garbage as enabled', () => {
    expect(isFeatureEnabled('sessions' as unknown, 'sessions')).toBe(true)
  })
})

describe('filterOrganizationsByFeature', () => {
  const orgs: { id: number; name: string; disabledFeatures?: OrganizationFeature[] }[] = [
    { id: 1, name: 'All enabled', disabledFeatures: [] },
    { id: 2, name: 'Schedules off', disabledFeatures: ['schedules'] },
    { id: 3, name: 'Schedules and themes off', disabledFeatures: ['schedules', 'themes'] },
    { id: 4, name: 'Undefined flags', disabledFeatures: undefined },
  ]

  it('should keep only orgs with the feature enabled', () => {
    const result = filterOrganizationsByFeature(orgs, 'schedules')

    expect(result.map((org) => org.id)).toEqual([1, 4])
  })

  it('should keep only orgs with themes enabled', () => {
    const result = filterOrganizationsByFeature(orgs, 'themes')

    expect(result.map((org) => org.id)).toEqual([1, 2, 4])
  })

  it('should keep all orgs when sessions is enabled everywhere', () => {
    const result = filterOrganizationsByFeature(orgs, 'sessions')

    expect(result).toHaveLength(4)
  })
})
