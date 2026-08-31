import { describe, it, expect } from 'vitest'
import { DYNAMIC_ROUTE_RESOLVERS, findDynamicResolver } from './dynamicRouteResolvers'

describe('DYNAMIC_ROUTE_RESOLVERS registry', () => {
  it('registers every known dynamic detail route (11 resolvers)', () => {
    expect(DYNAMIC_ROUTE_RESOLVERS).toHaveLength(11)
  })

  it('does not register two resolvers that both match the same two-segment route', () => {
    for (const prefix of ['members', 'groups', 'standards', 'liaisons', 'national-bodies', 'projects', 'posts', 'faq', 'procedures']) {
      const sample = [prefix, 'sample-id']
      const matches = DYNAMIC_ROUTE_RESOLVERS.filter((r) => r.matches(sample))
      expect(matches, `prefix ${prefix}`).toHaveLength(1)
    }
  })

  it('matches resolution detail (4 segments, not meetings)', () => {
    expect(findDynamicResolver(['resolutions', 'plenary-meeting-32', '001', '2023'])).toBeDefined()
    expect(findDynamicResolver(['resolutions', 'meetings'])).toBeUndefined()
  })

  it('matches meeting detail only when ordinal is numeric', () => {
    expect(findDynamicResolver(['meetings', '32'])).toBeDefined()
    expect(findDynamicResolver(['meetings', 'abc'])).toBeUndefined()
    expect(findDynamicResolver(['meetings'])).toBeUndefined()
  })

  it('does not match list routes (single segment)', () => {
    for (const route of ['members', 'groups', 'standards', 'liaisons', 'national-bodies', 'projects', 'posts', 'faq', 'procedures', 'meetings', 'resolutions']) {
      expect(findDynamicResolver([route]), `single-segment ${route}`).toBeUndefined()
    }
  })

  it('every resolver exposes both matches and resolve', () => {
    for (const r of DYNAMIC_ROUTE_RESOLVERS) {
      expect(typeof r.matches).toBe('function')
      expect(typeof r.resolve).toBe('function')
    }
  })
})
