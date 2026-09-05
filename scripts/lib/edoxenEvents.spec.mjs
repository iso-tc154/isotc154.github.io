import { describe, it, expect } from 'vitest'
import {
  toISODate, parseXlsxDate, groupRowsByOrdinal, deriveStatus, landingUrls,
  toEdoxenHosts, toEdoxenDeadlines, localize, deepISOStrings, decisionRefs,
} from './edoxenEvents.mjs'

describe('toISODate', () => {
  it('normalizes Date objects, strings, and rejects garbage', () => {
    expect(toISODate(new Date(Date.UTC(2026, 7, 31)))).toBe('2026-08-31')
    expect(toISODate('2026-08-31T09:00:00Z')).toBe('2026-08-31')
    expect(toISODate('2026-08-31')).toBe('2026-08-31')
    expect(toISODate('whenever')).toBeNull()
    expect(toISODate(null)).toBeNull()
  })
})

describe('parseXlsxDate', () => {
  it('parses the export format "31 Aug 2026 00:00 CEST"', () => {
    expect(parseXlsxDate('31 Aug 2026 00:00 CEST')).toBe('2026-08-31')
    expect(parseXlsxDate('4 Sep 2026 23:59')).toBe('2026-09-04')
    expect(parseXlsxDate('13 Oct 2022 00:00 UTC')).toBe('2022-10-13')
  })
  it('pads single digits and rejects unknown months', () => {
    expect(parseXlsxDate('2 May 2019')).toBe('2019-05-02')
    expect(parseXlsxDate('2 Zzz 2019')).toBeNull()
    expect(parseXlsxDate(null)).toBeNull()
  })
})

describe('groupRowsByOrdinal', () => {
  it('groups multi-session plenaries and skips null ordinals', () => {
    const rows = [
      { ordinal: 41, iso_meeting_id: 113743 },
      { ordinal: 39, iso_meeting_id: 67789 },
      { ordinal: 41, iso_meeting_id: 112750 },
      { ordinal: null },
    ]
    const byOrdinal = groupRowsByOrdinal(rows)
    expect([...byOrdinal.keys()].sort()).toEqual([39, 41])
    expect(byOrdinal.get(41)).toHaveLength(2)
  })
})

describe('deriveStatus', () => {
  const TODAY = '2026-09-05'
  it('rich curated dates win over the xlsx window', () => {
    const rows = [{ start_date: '13 Oct 2022 00:00 UTC', end_date: '14 Oct 2022 23:59 UTC', status: 'closed' }]
    const rich = { time: { from: { date: '2022-10-12' }, to: { date: '2022-10-14' } } }
    expect(deriveStatus(rows, rich, TODAY)).toMatchObject({ start: '2022-10-12', end: '2022-10-14', status: 'completed' })
  })
  it('falls back to the full xlsx span across sessions', () => {
    const rows = [
      { start_date: '02 Sep 2021 00:00 UTC', end_date: '02 Sep 2021 23:59 UTC' },
      { start_date: '21 Oct 2021 00:00 UTC', end_date: '28 Oct 2021 23:59 UTC' },
    ]
    expect(deriveStatus(rows, {}, TODAY)).toMatchObject({ start: '2021-09-02', end: '2021-10-28', status: 'completed' })
  })
  it('cancelled dominates; future meetings are upcoming', () => {
    expect(deriveStatus([{ status: 'cancelled', start_date: '4 May 2010' }], {}, TODAY).status).toBe('cancelled')
    expect(deriveStatus([{ start_date: '1 Jan 2030' }], {}, TODAY).status).toBe('upcoming')
    expect(deriveStatus([{ start_date: '4 May 2010' }], {}, TODAY).status).toBe('completed')
  })
})

describe('landingUrls', () => {
  it('collects unique http(s) URLs across session rows', () => {
    expect(landingUrls([
      { iso_meeting_url: 'https://sd.iso.org/meetings/113743' },
      { iso_meeting_url: 'https://sd.iso.org/meetings/113743' },
      { iso_meeting_url: 'https://sd.iso.org/meetings/112750' },
      { iso_meeting_url: undefined },
    ])).toEqual(['https://sd.iso.org/meetings/113743', 'https://sd.iso.org/meetings/112750'])
  })
})

describe('toEdoxenHosts', () => {
  it('maps hyphenated types, synthesizes refs, drops free-form types', () => {
    expect(toEdoxenHosts([
      { ref: 'din', type: 'national-body' },
      { name: 'UNECE', type: 'liaison' },
      { name: 'CEN/ISSS', type: 'external' },
    ])).toEqual([
      { ref: 'din', type: 'national_body' },
      { ref: 'unece', type: 'liaison' },
    ])
  })
  it('keeps roles and returns null when nothing survives', () => {
    expect(toEdoxenHosts([{ ref: 'calconnect', type: 'liaison', role: 'co-host' }]))
      .toEqual([{ ref: 'calconnect', type: 'liaison', role: 'co-host' }])
    expect(toEdoxenHosts([{ name: 'X', type: 'external' }])).toBeNull()
    expect(toEdoxenHosts(null)).toBeNull()
  })
})

describe('toEdoxenDeadlines', () => {
  it('drops date-less standing instructions and localizes descriptions', () => {
    expect(toEdoxenDeadlines([
      { date: new Date(Date.UTC(2026, 7, 17)), description: 'Register' },
      { description: 'Standing instruction, no date' },
    ])).toEqual([{ date: '2026-08-17', description: [{ spelling: 'eng', value: 'Register' }] }])
    expect(toEdoxenDeadlines([{ description: 'no date' }])).toBeNull()
  })
})

describe('deepISOStrings', () => {
  it('converts every Date in a nested doc', () => {
    expect(deepISOStrings({ a: new Date(Date.UTC(2026, 0, 2)), b: [{ c: new Date(Date.UTC(2026, 11, 31)) }], d: 'keep' }))
      .toEqual({ a: '2026-01-02', b: [{ c: '2026-12-31' }], d: 'keep' })
  })
})

describe('decisionRefs', () => {
  it('extracts prefix/number pairs from a staged decision doc', () => {
    expect(decisionRefs({ decisions: [
      { identifier: [{ prefix: 'ISO/TC 154', number: '2023-01' }] },
      { identifier: [{ prefix: 'ISO/TC 154', number: '2023-02' }] },
      { urn: 'urn:x' },
    ] })).toEqual([
      { prefix: 'ISO/TC 154', number: '2023-01' },
      { prefix: 'ISO/TC 154', number: '2023-02' },
    ])
    expect(decisionRefs(null)).toEqual([])
  })
})
