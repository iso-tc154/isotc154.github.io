import { describe, it, expect } from 'vitest'
import {
  isUpcoming,
  isConcluded,
  isCancelled,
  decadeOf,
  decadeLabel,
  typeInitials,
  groupByDecade,
  decadeFacets,
  searchHaystack,
} from './meetingPresentation'
import type { Meeting, MeetingSession } from '../types/meeting'

const session = (overrides: Partial<MeetingSession> = {}): MeetingSession => ({
  iso_meeting_id: null,
  type: 'face-to-face',
  status: 'closed',
  start_date: null,
  end_date: null,
  country: null,
  city: null,
  address: null,
  virtual_address: null,
  participants: null,
  iso_meeting_url: null,
  cancellation_comment: null,
  reschedule_note: null,
  reschedule_timeframe: null,
  parent_iso_meeting_id: null,
  ...overrides,
})

const mk = (o: Partial<Meeting> & { ordinal: number }): Meeting => ({
  ordinal: o.ordinal,
  year: o.year !== undefined ? o.year : 2024,
  url: o.url ?? `/meetings/${o.ordinal}/`,
  sessions: o.sessions ?? [session()],
  primary: o.primary ?? session(),
  status_label: o.status_label ?? 'Concluded',
  type_label: o.type_label ?? 'In person',
  location_label: o.location_label ?? 'Geneva, CH',
  date_label: o.date_label ?? 'Oct 2024',
  participant_total: o.participant_total ?? null,
  resolution_count: o.resolution_count ?? 0,
  acclamation_count: o.acclamation_count ?? 0,
  resolutions_url: o.resolutions_url ?? null,
  resolutions_meeting_urn: o.resolutions_meeting_urn ?? null,
})

describe('status classification', () => {
  it('isUpcoming is true for anything other than Concluded/Cancelled', () => {
    expect(isUpcoming(mk({ ordinal: 1, status_label: 'Confirmed' }))).toBe(true)
    expect(isUpcoming(mk({ ordinal: 1, status_label: 'Tentative' }))).toBe(true)
    expect(isUpcoming(mk({ ordinal: 1, status_label: 'Some New Status' }))).toBe(true)
  })

  it('isUpcoming is false for terminal states', () => {
    expect(isUpcoming(mk({ ordinal: 1, status_label: 'Concluded' }))).toBe(false)
    expect(isUpcoming(mk({ ordinal: 1, status_label: 'Cancelled' }))).toBe(false)
  })

  it('isConcluded only matches "Concluded"', () => {
    expect(isConcluded(mk({ ordinal: 1, status_label: 'Concluded' }))).toBe(true)
    expect(isConcluded(mk({ ordinal: 1, status_label: 'Cancelled' }))).toBe(false)
    expect(isConcluded(mk({ ordinal: 1, status_label: 'Confirmed' }))).toBe(false)
  })

  it('isCancelled only matches "Cancelled"', () => {
    expect(isCancelled(mk({ ordinal: 1, status_label: 'Cancelled' }))).toBe(true)
    expect(isCancelled(mk({ ordinal: 1, status_label: 'Concluded' }))).toBe(false)
  })
})

describe('decadeOf', () => {
  it('floors a year to its decade', () => {
    expect(decadeOf(1987)).toBe(1980)
    expect(decadeOf(1990)).toBe(1990)
    expect(decadeOf(2024)).toBe(2020)
    expect(decadeOf(2000)).toBe(2000)
  })

  it('returns null when year is missing or non-numeric', () => {
    expect(decadeOf(null)).toBeNull()
    expect(decadeOf(undefined)).toBeNull()
    expect(decadeOf(NaN)).toBeNull()
  })
})

describe('decadeLabel', () => {
  it('formats a decade as `${d}s`', () => {
    expect(decadeLabel(1980)).toBe('1980s')
    expect(decadeLabel(2020)).toBe('2020s')
  })
})

describe('typeInitials', () => {
  it('maps known meeting types to short badges', () => {
    expect(typeInitials(mk({ ordinal: 1, type_label: 'Hybrid' }))).toBe('HYB')
    expect(typeInitials(mk({ ordinal: 1, type_label: 'Virtual' }))).toBe('VRT')
    expect(typeInitials(mk({ ordinal: 1, type_label: 'In person' }))).toBe('F2F')
  })

  it('falls back to first-three uppercase for unknown types', () => {
    expect(typeInitials(mk({ ordinal: 1, type_label: 'Teleconference' }))).toBe('TEL')
  })
})

describe('groupByDecade', () => {
  it('buckets meetings by decade, newest decade first', () => {
    const list = [
      mk({ ordinal: 30, year: 2011 }),
      mk({ ordinal: 44, year: 2024 }),
      mk({ ordinal: 10, year: 1987 }),
      mk({ ordinal: 20, year: 1998 }),
    ]
    const groups = groupByDecade(list)
    expect(groups.map((g) => g.decade)).toEqual([2020, 2010, 1990, 1980])
  })

  it('within a decade, meetings sort newest-ordinal-first', () => {
    const list = [
      mk({ ordinal: 41, year: 2021 }),
      mk({ ordinal: 44, year: 2024 }),
      mk({ ordinal: 42, year: 2022 }),
    ]
    const groups = groupByDecade(list)
    expect(groups[0].meetings.map((m) => m.ordinal)).toEqual([44, 42, 41])
  })

  it('sums resolution counts per decade', () => {
    const list = [
      mk({ ordinal: 44, year: 2024, resolution_count: 12 }),
      mk({ ordinal: 43, year: 2023, resolution_count: 8 }),
      mk({ ordinal: 30, year: 2011, resolution_count: 5 }),
    ]
    const groups = groupByDecade(list)
    const byDecade = new Map(groups.map((g) => [g.decade, g.resolutionCount]))
    expect(byDecade.get(2020)).toBe(20)
    expect(byDecade.get(2010)).toBe(5)
  })

  it('drops meetings without a year', () => {
    const list = [
      mk({ ordinal: 1, year: null }),
      mk({ ordinal: 2, year: 2024 }),
    ]
    const groups = groupByDecade(list)
    expect(groups).toHaveLength(1)
    expect(groups[0].decade).toBe(2020)
  })

  it('returns [] for empty input', () => {
    expect(groupByDecade([])).toEqual([])
  })

  it('label uses decadeLabel', () => {
    const groups = groupByDecade([mk({ ordinal: 44, year: 2024 })])
    expect(groups[0].label).toBe('2020s')
  })
})

describe('decadeFacets', () => {
  it('returns distinct decades sorted descending', () => {
    const list = [
      mk({ ordinal: 10, year: 1987 }),
      mk({ ordinal: 30, year: 2011 }),
      mk({ ordinal: 20, year: 1998 }),
      mk({ ordinal: 31, year: 2013 }),
    ]
    expect(decadeFacets(list)).toEqual([2010, 1990, 1980])
  })

  it('skips meetings without a year', () => {
    const list = [
      mk({ ordinal: 1, year: null }),
      mk({ ordinal: 44, year: 2024 }),
    ]
    expect(decadeFacets(list)).toEqual([2020])
  })

  it('returns [] for empty input', () => {
    expect(decadeFacets([])).toEqual([])
  })
})

describe('searchHaystack', () => {
  it('combines ordinal, year, location label, and session fields', () => {
    const m = mk({
      ordinal: 42,
      year: 2022,
      location_label: 'Berlin, DE',
      sessions: [
        session({ country: 'DE', city: 'Berlin', virtual_address: null }),
        session({ country: 'CH', city: 'Geneva', virtual_address: 'https://zoom.us/j/abc' }),
      ],
    })
    const hay = searchHaystack(m)
    expect(hay).toContain('42')
    expect(hay).toContain('2022')
    expect(hay).toContain('berlin, de')
    expect(hay).toContain('geneva')
    expect(hay).toContain('https://zoom.us/j/abc')
  })

  it('is lowercase for case-insensitive search', () => {
    const m = mk({ ordinal: 1, year: null, location_label: 'GENEVA' })
    expect(searchHaystack(m)).toBe('1  geneva ')
  })

  it('omits empty session fields', () => {
    const m = mk({
      ordinal: 1,
      year: null,
      location_label: '',
      sessions: [session({ country: null, city: null, virtual_address: null })],
    })
    expect(searchHaystack(m)).toBe('1   ')
  })
})
