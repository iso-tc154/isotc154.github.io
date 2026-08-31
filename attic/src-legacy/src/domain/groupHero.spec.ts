import { describe, it, expect } from 'vitest'
import { resolveGroupHeroData, type RosterLike } from './groupHero'
import type { ConvenorTerm, Group } from '../types/group'

function makeGroup(overrides: Partial<Group> = {}): Group {
  return {
    id: 'g',
    name: 'G',
    title: 'Group',
    category: 'working',
    order: 1,
    ...overrides,
  }
}

function makeRoster(): RosterLike & { calls: { ids: string[]; terms?: ConvenorTerm[] }[] } {
  const calls: { ids: string[]; terms?: ConvenorTerm[] }[] = []
  return {
    calls,
    heroPeople(ids, terms) {
      calls.push({ ids, terms })
      return ids.map(id => ({ id, name: id.toUpperCase() }))
    },
    standardCardsFor(raws) {
      return raws.map(raw => ({ raw, url: '', year: '', stage: '' }))
    },
    projectCardsFor(ids) {
      return ids.map(id => ({ id, url: '', name: id, statusLabel: '', excerpt: '' }))
    },
  }
}

describe('resolveGroupHeroData', () => {
  it('uses convenors when present and labels them "Convenor"', () => {
    const group = makeGroup({ convenors: ['alice'] })
    const roster = makeRoster()
    const data = resolveGroupHeroData(group, roster, [])
    expect(data.heroConvenorLabel).toBe('Convenor')
    expect(data.heroConvenors).toHaveLength(1)
    expect(roster.calls[0]).toMatchObject({ ids: ['alice'] })
  })

  it('falls back to co_chairs when no convenors', () => {
    const group = makeGroup({ co_chairs: ['bob'] })
    const data = resolveGroupHeroData(group, makeRoster(), [])
    expect(data.heroConvenorLabel).toBe('Co-chair')
  })

  it('returns empty label when neither convenors nor co_chairs', () => {
    const data = resolveGroupHeroData(makeGroup(), makeRoster(), [])
    expect(data.heroConvenorLabel).toBe('')
  })

  it('prefers group.convenors over organization.convenors', () => {
    const group = makeGroup({
      convenors: ['top-level'],
      organization: { convenors: ['nested'] },
    })
    const roster = makeRoster()
    resolveGroupHeroData(group, roster, [])
    expect(roster.calls[0].ids).toEqual(['top-level'])
  })

  it('falls back to organization.* when top-level arrays are absent', () => {
    const group = makeGroup({
      organization: {
        convenors: ['o-conv'],
        managers: ['o-mgr'],
        secretaries: ['o-sec'],
      },
    })
    const roster = makeRoster()
    const data = resolveGroupHeroData(group, roster, [])
    expect(data.heroConvenors.map(p => p.id)).toEqual(['o-conv'])
    expect(data.heroManagers.map(p => p.id)).toEqual(['o-mgr'])
    expect(data.heroSecretaries.map(p => p.id)).toEqual(['o-sec'])
  })

  it('resolves convenor seats when group.convenor_seats is set', () => {
    const group = makeGroup({
      convenor_seats: [
        { label: 'Seat A', member_ids: ['alice', 'bob'] },
        { label: 'Seat B', member_ids: ['carol'] },
      ],
    })
    const data = resolveGroupHeroData(group, makeRoster(), [])
    expect(data.convenorSeats).toHaveLength(2)
    expect(data.convenorSeats?.[0].label).toBe('Seat A')
    expect(data.convenorSeats?.[0].people).toHaveLength(2)
  })

  it('returns undefined convenorSeats when absent', () => {
    const data = resolveGroupHeroData(makeGroup(), makeRoster(), [])
    expect(data.convenorSeats).toBeUndefined()
  })

  it('passes convenor terms through to heroPeople for convenors and seats', () => {
    const terms: ConvenorTerm[] = [{
      member_id: 'alice', name: 'Alice', from: '2020-01-01', to: null, current: true,
    }]
    const group = makeGroup({
      convenors: ['alice'],
      convenor_seats: [{ label: 'Seat A', member_ids: ['alice'] }],
    })
    const roster = makeRoster()
    resolveGroupHeroData(group, roster, terms)
    // calls[0] = convenors, [1] = managers, [2] = secretaries, [3] = first seat
    const withTerms = roster.calls.filter(c => c.terms === terms)
    expect(withTerms).toHaveLength(2)
    expect(withTerms.map(c => c.ids)).toEqual([['alice'], ['alice']])
  })

  it('returns empty standard/project cards when group has none', () => {
    const data = resolveGroupHeroData(makeGroup(), makeRoster(), [])
    expect(data.standardCards).toEqual([])
    expect(data.projectCards).toEqual([])
  })
})
