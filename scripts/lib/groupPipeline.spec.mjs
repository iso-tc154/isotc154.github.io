import { describe, it, expect } from 'vitest'
import { buildGroupRecords } from './groupPipeline.mjs'

// Real model instances — no doubles. Plain objects shaped like the data
// that flows through the build pipeline.

function makeGroup(overrides = {}) {
  // Mimic the shape that loadGroups() initializes (members.mjs lines 19-27).
  return {
    id: 'wg5',
    name: 'WG 5',
    title: 'Group',
    category: 'working',
    order: 1,
    members: [],
    past_members: [],
    convenors: [],
    co_chairs: [],
    managers: [],
    ...overrides,
  }
}

function makeMember(overrides = {}) {
  const roleRecord = {
    id: 'convenor',
    group: 'wg5',
    from: { date: '2013-10-28', precision: 'day' },
  }
  return {
    id: 'm1',
    'member-id': 'm1',
    name: 'Klaus-Dieter Naujok',
    active: true,
    // Mimic the role-index shape that loadMembers() builds. attachMembersToGroups
    // reads roles._all.in.<groupId>, not the raw roles array.
    roles: {
      _all: {
        in: {
          _all: [roleRecord],
          wg5: [roleRecord],
        },
      },
    },
    ...overrides,
  }
}

function makeEvents() {
  return {
    events: [
      {
        group_id: 'wg5',
        type: 'established',
        date: '2013-10-28',
        precision: 'day',
        title: 'ISO/TC 154/WG 5 established',
        resolution_ref: '001-2013',
        resolution_meeting: 'P32',
      },
      {
        group_id: 'wg5',
        type: 'convenor_appointed',
        date: '2013-10-28',
        precision: 'day',
        title: 'Klaus-Dieter Naujok appointed convenor',
        person_name: 'Klaus-Dieter Naujok',
        person_member_id: 'm1',
        resolution_ref: '004-2013',
        resolution_meeting: 'P32',
      },
    ],
    overrides: [],
  }
}

describe('buildGroupRecords', () => {
  it('runs all three passes and returns the groups map', () => {
    const groups = { wg5: makeGroup() }
    const members = { m1: makeMember() }
    const events = makeEvents()

    const result = buildGroupRecords(groups, members, events)

    expect(result).toBe(groups) // mutates and returns the same map

    // Pass 1 — attachMembersToGroups seeded convenor_terms
    const convenorTerms = groups.wg5.convenor_terms
    expect(convenorTerms).toBeInstanceOf(Array)
    expect(convenorTerms).toHaveLength(1)
    expect(convenorTerms[0].name).toBe('Klaus-Dieter Naujok')

    // Pass 2 — attachGroupLifecycle wrote established + events
    expect(groups.wg5.history?.established?.date).toBe('2013-10-28')
    expect(groups.wg5.history?.events).toHaveLength(2)

    // Pass 3 — enrichConvenorTerms decorated the term with resolution_ref
    expect(convenorTerms[0].resolution_ref).toBe('004-2013')
  })

  it('is safe on empty inputs (no events, no members)', () => {
    const groups = { wg5: makeGroup() }
    buildGroupRecords(groups, {}, { events: [], overrides: [] })

    expect(groups.wg5.convenor_terms).toBeInstanceOf(Array)
    expect(groups.wg5.history?.events ?? []).toEqual([])
  })

  it('runs passes in the order required by their data dependencies', () => {
    // The enrichment pass (3) joins convenor_terms (from pass 1) against
    // lifecycle events (from pass 2). If the order were wrong, the
    // resolution_ref would never be attached. This spec pins that contract.
    const groups = { wg5: makeGroup() }
    const members = { m1: makeMember() }
    const events = makeEvents()

    buildGroupRecords(groups, members, events)

    const term = groups.wg5.convenor_terms[0]
    expect(term.resolution_ref).toBe('004-2013')
    expect(term.current).toBe(true)
  })
})
