import { describe, it, expect, beforeEach } from 'vitest'
import {
  loadGroupEvents,
  deriveGroupLifecycle,
  attachGroupLifecycle,
} from './groupHistory.mjs'

// Real model instances — no doubles. Each fixture is shaped exactly like
// the data that flows through the build pipeline.

function makeGroup(overrides = {}) {
  return {
    id: 'g',
    name: 'G',
    title: 'Group',
    category: 'working',
    order: 1,
    ...overrides,
  }
}

function makeEvent(overrides = {}) {
  return {
    group_id: 'g',
    type: 'established',
    date: '2010-01-01',
    precision: 'day',
    title: 'Established',
    ...overrides,
  }
}

describe('loadGroupEvents', () => {
  it('returns empty shape when the file does not exist', () => {
    const result = loadGroupEvents('/does/not/exist.yml')
    expect(result.events).toEqual([])
    expect(result.overrides).toEqual([])
  })

  it('loads events and overrides verbatim from a YAML file', async () => {
    const tmpFile = process.cwd() + '/.tmp-events-test.yml'
    const { writeFileSync, unlinkSync, existsSync } = await import('node:fs')
    const yaml = [
      'events:',
      '  - group_id: wg5',
      '    type: established',
      '    date: 2013-10-28',
      '    title: Established',
      'overrides:',
      '  - group_id: wg3',
      '    field: established',
      '    date: 2006-03-01',
    ].join('\n')
    writeFileSync(tmpFile, yaml)
    try {
      const result = loadGroupEvents(tmpFile)
      expect(result.events).toHaveLength(1)
      expect(result.events[0]).toMatchObject({
        group_id: 'wg5',
        type: 'established',
        title: 'Established',
      })
      expect(result.overrides).toHaveLength(1)
      expect(result.overrides[0]).toMatchObject({
        group_id: 'wg3',
        field: 'established',
      })
    } finally {
      if (existsSync(tmpFile)) unlinkSync(tmpFile)
    }
  })
})

describe('deriveGroupLifecycle', () => {
  const groupsById = {
    wg5: makeGroup({ id: 'wg5', name: 'WG 5' }),
    wg4: makeGroup({ id: 'wg4', name: 'WG 4', inactive: true }),
    jwg4: makeGroup({ id: 'jwg4', name: 'JWG 4', inactive: true }),
    jwg2: makeGroup({ id: 'jwg2', name: 'JWG 2', inactive: true }),
    cag: makeGroup({ id: 'cag', name: 'CAG' }),
    wg3: makeGroup({ id: 'wg3', name: 'WG 3' }),
  }

  it('returns null fields when no events exist for the group', () => {
    const result = deriveGroupLifecycle('unknown', { events: [], overrides: [] }, groupsById)
    expect(result.established).toBeNull()
    expect(result.dissolved).toBeNull()
    expect(result.predecessor).toBeNull()
    expect(result.successor).toBeNull()
    expect(result.events).toEqual([])
  })

  it('derives established from the last state event when it is "established"', () => {
    const events = {
      events: [
        makeEvent({ group_id: 'wg5', type: 'established', date: '2013-10-28', resolution_ref: '003-2013', resolution_meeting: 'P32' }),
      ],
      overrides: [],
    }
    const result = deriveGroupLifecycle('wg5', events, groupsById)
    expect(result.established).toMatchObject({
      date: '2013-10-28',
      resolution_ref: '003-2013',
      resolution_meeting: 'P32',
    })
    expect(result.dissolved).toBeNull()
  })

  it('does not derive dissolved when the last state event is established', () => {
    const events = {
      events: [
        makeEvent({ group_id: 'wg5', type: 'dissolved', date: '2015-01-01' }),
        makeEvent({ group_id: 'wg5', type: 'established', date: '2018-01-01' }),
      ],
      overrides: [],
    }
    const result = deriveGroupLifecycle('wg5', events, groupsById)
    expect(result.established?.date).toBe('2018-01-01')
    expect(result.dissolved).toBeNull()
  })

  it('derives dissolved only when group.inactive is truthy and last state event is dissolved', () => {
    const events = {
      events: [
        makeEvent({ group_id: 'wg4', type: 'established', date: '2011-09-14' }),
        makeEvent({ group_id: 'wg4', type: 'dissolved', date: '2022-10-14', resolution_ref: '2022-01' }),
      ],
      overrides: [],
    }
    const result = deriveGroupLifecycle('wg4', events, groupsById)
    expect(result.dissolved).toMatchObject({
      date: '2022-10-14',
      resolution_ref: '2022-01',
    })
    expect(result.established).toBeNull()
  })

  it('does NOT derive dissolved when group is active (CAG case)', () => {
    const events = {
      events: [
        makeEvent({ group_id: 'cag', type: 'dissolved', date: '2011-09-14', successor: 'cag2' }),
      ],
      overrides: [],
    }
    const result = deriveGroupLifecycle('cag', events, groupsById)
    expect(result.dissolved).toBeNull()
  })

  it('derives predecessor from the earliest established event that carries one', () => {
    const events = {
      events: [
        makeEvent({
          group_id: 'wg4',
          type: 'established',
          date: '2011-09-14',
          predecessor: 'jwg4',
          resolution_ref: '316',
          resolution_meeting: 'P30',
        }),
        makeEvent({ group_id: 'wg4', type: 'dissolved', date: '2022-10-14' }),
      ],
      overrides: [],
    }
    const result = deriveGroupLifecycle('wg4', events, groupsById)
    expect(result.predecessor).toMatchObject({
      id: 'jwg4',
      name: 'JWG 4',
      date: '2011-09-14',
      resolution_ref: '316',
    })
  })

  it('derives successor from the latest dissolved event that carries one', () => {
    const events = {
      events: [
        makeEvent({
          group_id: 'jwg2',
          type: 'dissolved',
          date: '2009-09-25',
          successor: 'jwg4',
          resolution_ref: '305',
        }),
      ],
      overrides: [],
    }
    const result = deriveGroupLifecycle('jwg2', events, groupsById)
    expect(result.successor).toMatchObject({
      id: 'jwg4',
      name: 'JWG 4',
      date: '2009-09-25',
      resolution_ref: '305',
    })
  })

  it('uses the override established when no established event exists (WG 3 CCTS origin)', () => {
    const events = {
      events: [],
      overrides: [
        { group_id: 'wg3', field: 'established', date: '2006-03-01', precision: 'month' },
      ],
    }
    const result = deriveGroupLifecycle('wg3', events, groupsById)
    expect(result.established).toMatchObject({
      date: '2006-03-01',
      precision: 'month',
    })
    expect(result.events).toHaveLength(1)
    expect(result.events[0]).toMatchObject({
      type: 'established',
      date: '2006-03-01',
    })
  })

  it('converts override note fields into note events (WG 2 re-establishment)', () => {
    const events = {
      events: [],
      overrides: [
        { group_id: 'wg2', field: 'note', date: '2020-01-01', precision: 'year', title: 'Re-established', description: 'Note text' },
      ],
    }
    const result = deriveGroupLifecycle('wg2', events, {})
    expect(result.established).toBeNull()
    expect(result.events).toHaveLength(1)
    expect(result.events[0].type).toBe('note')
    expect(result.events[0].title).toBe('Re-established')
    expect(result.events[0].description).toBe('Note text')
  })

  it('sorts events by date ascending', () => {
    const events = {
      events: [
        makeEvent({ group_id: 'wg5', type: 'convenor_appointed', date: '2024-10-25', title: 'A' }),
        makeEvent({ group_id: 'wg5', type: 'established', date: '2013-10-28', title: 'B' }),
        makeEvent({ group_id: 'wg5', type: 'scope_change', date: '2018-05-01', title: 'C' }),
      ],
      overrides: [],
    }
    const result = deriveGroupLifecycle('wg5', events, groupsById)
    expect(result.events.map((e) => e.date)).toEqual([
      '2013-10-28',
      '2018-05-01',
      '2024-10-25',
    ])
  })

  it('normalises JS Date objects to ISO date strings (YAML auto-parse)', () => {
    const dateObj = new Date(Date.UTC(2013, 9, 28))
    const events = {
      events: [
        makeEvent({ group_id: 'wg5', type: 'established', date: dateObj }),
      ],
      overrides: [],
    }
    const result = deriveGroupLifecycle('wg5', events, groupsById)
    expect(result.established?.date).toBe('2013-10-28')
    expect(result.events[0].date).toBe('2013-10-28')
  })
})

describe('attachGroupLifecycle', () => {
  it('attaches history.events, established, dissolved, predecessor, successor', () => {
    const groups = {
      wg5: makeGroup({ id: 'wg5', name: 'WG 5' }),
    }
    const eventData = {
      events: [
        makeEvent({ group_id: 'wg5', type: 'established', date: '2013-10-28', resolution_ref: '003-2013' }),
      ],
      overrides: [],
    }
    attachGroupLifecycle(groups, eventData)
    expect(groups.wg5.history.events).toHaveLength(1)
    expect(groups.wg5.history.established).toMatchObject({ date: '2013-10-28' })
    expect(groups.wg5.history.dissolved).toBeNull()
  })

  it('preserves legacy story and leadership fields when attaching', () => {
    const groups = {
      wg5: makeGroup({
        id: 'wg5',
        history: {
          leadership: ['klaus-dieter-naujok'],
          story: 'Prose narrative…',
        },
      }),
    }
    attachGroupLifecycle(groups, { events: [], overrides: [] })
    expect(groups.wg5.history.leadership).toEqual(['klaus-dieter-naujok'])
    expect(groups.wg5.history.story).toBe('Prose narrative…')
    expect(groups.wg5.history.events).toEqual([])
  })

  it('warns when events reference an unknown group', () => {
    const originalWarn = console.warn
    const warnings = []
    console.warn = (msg) => warnings.push(msg)
    try {
      attachGroupLifecycle({}, {
        events: [makeEvent({ group_id: 'ghost' })],
        overrides: [],
      })
      expect(warnings.some((w) => w.includes('ghost'))).toBe(true)
    } finally {
      console.warn = originalWarn
    }
  })

  it('does not overwrite a legacy established date when events have no establishment', () => {
    const groups = {
      wg3: makeGroup({
        id: 'wg3',
        history: { established: { date: '1999-01-01' } },
      }),
    }
    attachGroupLifecycle(groups, { events: [], overrides: [] })
    expect(groups.wg3.history.established).toMatchObject({ date: '1999-01-01' })
  })
})
