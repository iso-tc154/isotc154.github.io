import { describe, it, expect } from 'vitest'
import { attachMembersToGroups, enrichConvenorTerms } from './members.mjs'

// Real model instances — no doubles. Members and groups are shaped
// exactly as build-data.mjs produces them.

function makeMember(id, roles) {
  return {
    'member-id': id,
    name: id.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
    active: true,
    roles: { _all: { in: { _all: [] } } },
  }
}

function makeGroup(id, overrides = {}) {
  return {
    id,
    name: id.toUpperCase(),
    title: 'Group ' + id,
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

function memberWithRole(memberId, groupId, roleId, from, to) {
  const m = makeMember(memberId)
  const role = { id: roleId }
  if (groupId) role.group = groupId
  if (from) role.from = from
  if (to !== undefined) role.to = to
  m.roles._all.in._all.push(role)
  if (groupId) {
    m.roles._all.in[groupId] = [role]
  }
  return m
}

describe('attachMembersToGroups', () => {
  it('derives convenor_terms from member role records with from/to dates', () => {
    const groups = { wg5: makeGroup('wg5') }
    const members = {
      'klaus-dieter-naujok': memberWithRole('klaus-dieter-naujok', 'wg5', 'convenor', '2013-10-28', null),
    }
    attachMembersToGroups(groups, members)
    expect(groups.wg5.convenor_terms).toHaveLength(1)
    expect(groups.wg5.convenor_terms[0]).toMatchObject({
      member_id: 'klaus-dieter-naujok',
      from: '2013-10-28',
      to: null,
      current: true,
      role: 'convenor',
    })
  })

  it('marks a term as current when role.to is null', () => {
    const groups = { wg5: makeGroup('wg5') }
    const members = {
      a: memberWithRole('a', 'wg5', 'convenor', '2020-01-01', null),
    }
    attachMembersToGroups(groups, members)
    expect(groups.wg5.convenor_terms[0].current).toBe(true)
  })

  it('marks a term as past when role.to is set', () => {
    const groups = { wg5: makeGroup('wg5') }
    const members = {
      a: memberWithRole('a', 'wg5', 'convenor', '2013-10-28', '2018-05-01'),
    }
    attachMembersToGroups(groups, members)
    expect(groups.wg5.convenor_terms[0].current).toBe(false)
    expect(groups.wg5.convenor_terms[0].to).toBe('2018-05-01')
  })

  it('treats co_chair roles as convenor terms', () => {
    const groups = { jwg9: makeGroup('jwg9') }
    const members = {
      'yan-zhang': memberWithRole('yan-zhang', 'jwg9', 'co_chair', '2023-10-27', null),
    }
    attachMembersToGroups(groups, members)
    expect(groups.jwg9.convenor_terms).toHaveLength(1)
    expect(groups.jwg9.convenor_terms[0].role).toBe('co_chair')
  })

  it('normalises JS Date objects in role.from / role.to', () => {
    const groups = { wg5: makeGroup('wg5') }
    const members = {
      a: memberWithRole('a', 'wg5', 'convenor', new Date(Date.UTC(2013, 9, 28)), null),
    }
    attachMembersToGroups(groups, members)
    expect(groups.wg5.convenor_terms[0].from).toBe('2013-10-28')
  })

  it('skips convenor role records with no from date', () => {
    const groups = { wg5: makeGroup('wg5') }
    const members = {
      a: memberWithRole('a', 'wg5', 'convenor', null, null),
    }
    attachMembersToGroups(groups, members)
    expect(groups.wg5.convenor_terms).toEqual([])
  })

  it('sorts convenor terms by from date, then by name', () => {
    const groups = { wg5: makeGroup('wg5') }
    const members = {
      'b-person': memberWithRole('b-person', 'wg5', 'convenor', '2020-01-01', null),
      'a-person': memberWithRole('a-person', 'wg5', 'convenor', '2020-01-01', null),
      'c-person': memberWithRole('c-person', 'wg5', 'convenor', '2015-01-01', '2019-12-31'),
    }
    attachMembersToGroups(groups, members)
    const order = groups.wg5.convenor_terms.map((t) => t.member_id)
    expect(order).toEqual(['c-person', 'a-person', 'b-person'])
  })

  it('populates convenors, members, managers arrays for current roles', () => {
    const groups = { wg5: makeGroup('wg5') }
    const members = {
      conv: memberWithRole('conv', 'wg5', 'convenor', '2020-01-01', null),
      mem: memberWithRole('mem', 'wg5', 'member', '2020-01-01', null),
      mgr: memberWithRole('mgr', 'wg5', 'manager', '2020-01-01', null),
    }
    attachMembersToGroups(groups, members)
    expect(groups.wg5.convenors).toEqual(['conv'])
    expect(groups.wg5.members).toEqual(['mem'])
    expect(groups.wg5.managers).toEqual(['mgr'])
  })

  it('pushes to past_members for past member roles', () => {
    const groups = { wg5: makeGroup('wg5') }
    const members = {
      ex: memberWithRole('ex', 'wg5', 'member', '2010-01-01', '2015-01-01'),
    }
    attachMembersToGroups(groups, members)
    expect(groups.wg5.past_members).toEqual(['ex'])
  })

  it('ignores roles for unknown groups', () => {
    const groups = { wg5: makeGroup('wg5') }
    const members = {
      a: memberWithRole('a', 'unknown-group', 'convenor', '2020-01-01', null),
    }
    attachMembersToGroups(groups, members)
    expect(groups.wg5.convenor_terms).toEqual([])
  })
})

describe('enrichConvenorTerms', () => {
  // enrichConvenorTerms reads the lifecycle events that attachGroupLifecycle
  // has already attached to group.history.events — it does not re-walk raw
  // eventData. Fixtures embed events there directly.

  it('joins resolution_ref to terms via member_id', () => {
    const groups = {
      wg5: makeGroup('wg5', {
        convenor_terms: [{
          member_id: 'klaus-dieter-naujok',
          name: 'Klaus-Dieter Naujok',
          from: '2013-10-28',
          to: null,
          current: true,
          role: 'convenor',
        }],
        history: {
          events: [
            {
              type: 'convenor_appointed',
              date: '2013-10-28',
              person_member_id: 'klaus-dieter-naujok',
              resolution_ref: '004-2013',
            },
          ],
        },
      }),
    }
    enrichConvenorTerms(groups)
    expect(groups.wg5.convenor_terms[0].resolution_ref).toBe('004-2013')
  })

  it('does not overwrite an existing resolution_ref', () => {
    const groups = {
      wg5: makeGroup('wg5', {
        convenor_terms: [{
          member_id: 'a',
          from: '2020-01-01',
          to: null,
          current: true,
          resolution_ref: 'original',
        }],
        history: {
          events: [
            {
              type: 'convenor_appointed',
              date: '2020-01-01',
              person_member_id: 'a',
              resolution_ref: 'replacement',
            },
          ],
        },
      }),
    }
    enrichConvenorTerms(groups)
    expect(groups.wg5.convenor_terms[0].resolution_ref).toBe('original')
  })

  it('extends term.to and clears current when term_until is later', () => {
    const groups = {
      ag1: makeGroup('ag1', {
        convenor_terms: [{
          member_id: 'jianfang-zhang',
          from: '2023-10-27',
          to: '2026-12-31',
          current: false,
          role: 'convenor',
        }],
        history: {
          events: [
            {
              type: 'convenor_appointed',
              date: '2023-10-27',
              person_member_id: 'jianfang-zhang',
              resolution_ref: '2023-19',
              term_until: '2026-12-31',
            },
            {
              type: 'convenor_extended',
              date: '2025-09-26',
              person_member_id: 'jianfang-zhang',
              resolution_ref: 'P-2025-10',
              term_until: '2028-12-31',
            },
          ],
        },
      }),
    }
    enrichConvenorTerms(groups)
    const term = groups.ag1.convenor_terms[0]
    expect(term.to).toBe('2028-12-31')
    expect(term.current).toBe(false)
    // The latest event by date wins (P-2025-10 extension, 2025-09-26)
    expect(term.resolution_ref).toBe('P-2025-10')
  })

  it('does not shorten a term when event term_until is earlier', () => {
    const groups = {
      wg5: makeGroup('wg5', {
        convenor_terms: [{
          member_id: 'a',
          from: '2020-01-01',
          to: '2030-12-31',
          current: false,
        }],
        history: {
          events: [
            {
              type: 'convenor_appointed',
              date: '2020-01-01',
              person_member_id: 'a',
              term_until: '2024-12-31',
            },
          ],
        },
      }),
    }
    enrichConvenorTerms(groups)
    expect(groups.wg5.convenor_terms[0].to).toBe('2030-12-31')
  })

  it('ignores events without person_member_id', () => {
    const groups = {
      wg5: makeGroup('wg5', {
        convenor_terms: [{
          member_id: 'a',
          from: '2020-01-01',
          to: null,
          current: true,
        }],
        history: {
          events: [
            {
              type: 'convenor_appointed',
              date: '2020-01-01',
              resolution_ref: '999',
            },
          ],
        },
      }),
    }
    enrichConvenorTerms(groups)
    expect(groups.wg5.convenor_terms[0].resolution_ref).toBeUndefined()
  })

  it('is a no-op for groups without convenor_terms', () => {
    const groups = {
      wg5: makeGroup('wg5', {
        history: {
          events: [
            {
              type: 'convenor_appointed',
              date: '2020-01-01',
              person_member_id: 'a',
              resolution_ref: '999',
            },
          ],
        },
      }),
    }
    delete groups.wg5.convenor_terms
    expect(() => enrichConvenorTerms(groups)).not.toThrow()
  })

  it('is a no-op for groups without history.events', () => {
    const groups = {
      wg5: makeGroup('wg5', {
        convenor_terms: [{
          member_id: 'a',
          from: '2020-01-01',
          to: null,
          current: true,
        }],
      }),
    }
    expect(() => enrichConvenorTerms(groups)).not.toThrow()
    expect(groups.wg5.convenor_terms[0].resolution_ref).toBeUndefined()
  })
})
