import { describe, it, expect } from 'vitest'
import {
  normalizeSnippet, isAcclamation, deriveDisplayTitle,
  buildResolutionRecord, sortResolutions, buildMeetingRecord,
} from './transforms.mjs'

describe('normalizeSnippet', () => {
  it('maps PUA bullet glyphs and collapses whitespace', () => {
    const bul = '\uF0B7', tri = '\uF0BE', arr = '\uF0D8', sp = '\uF020'
    expect(normalizeSnippet(`${bul}Item one\n ${tri} Item${sp}two ${arr}end`))
      .toBe('•Item one ‣ Item two ▸end')
  })
  it('truncates at 200 chars with ellipsis, keeps shorter text verbatim', () => {
    const long = 'a'.repeat(250)
    const out = normalizeSnippet(long)
    expect(out).toBe('a'.repeat(197) + '...')
    expect(out).toHaveLength(200)
    expect(normalizeSnippet('a'.repeat(200))).toBe('a'.repeat(200))
  })
  it('empty input yields empty string', () => {
    expect(normalizeSnippet('')).toBe('')
    expect(normalizeSnippet(undefined)).toBe('')
  })
})

describe('isAcclamation / deriveDisplayTitle', () => {
  it('keys off the -acclaim- id segment', () => {
    expect(isAcclamation('2023-01-acclaim-1')).toBe(true)
    expect(isAcclamation('2023-01')).toBe(false)
  })
  it('uses the title when present; Acclamation only for acclaims with actions', () => {
    expect(deriveDisplayTitle({ title: 'Named' }, false)).toBe('Named')
    expect(deriveDisplayTitle({ actions: [{ message: 'x' }] }, true)).toBe('Acclamation')
    expect(deriveDisplayTitle({ actions: [] }, true)).toBe('')
    expect(deriveDisplayTitle({}, false)).toBe('')
  })
})

describe('buildResolutionRecord', () => {
  const meta = {
    dates: [{ start: '2023-06-15' }, { start: '2023-06-16' }],
    venue: 'Berlin',
    title: '31st plenary',
  }
  it('derives urn/path/year from the first meeting date and flags acclaims', () => {
    const r = buildResolutionRecord(
      { identifier: '2023-05', subject: 'Liaison', actions: [{ message: '' }] },
      'plenary', 'plenary-31', meta,
    )
    expect(r).toMatchObject({
      id: '2023-05',
      subject: 'Liaison',
      year: '2023',
      venue: 'Berlin',
      meeting_date: '2023-06-15',
      source_type: 'plenary',
      source_file: 'plenary-31',
      source_title: '31st plenary',
      is_acclamation: false,
    })
    expect(r.urn).toMatch(/2023-05/)
    expect(r.path).toContain('plenary-31')
  })
  it('missing metadata degrades to empty strings, not crashes', () => {
    const r = buildResolutionRecord({ identifier: 'X' }, 'ballots', 'ballots-2026', {})
    expect(r.year).toBe('')
    expect(r.meeting_date).toBe('')
    expect(r.venue).toBe('')
    expect(r.title).toBe('')
  })
})

describe('sortResolutions', () => {
  const r = (id, meeting_date) => ({ id, meeting_date })
  it('newest meeting_date first; numeric ids descend within a meeting', () => {
    const xs = [r('2023-01', '2022-06-01'), r('2023-03', '2023-06-01'), r('2023-02', '2023-06-01')]
    expect(xs.sort(sortResolutions).map((x) => x.id)).toEqual(['2023-03', '2023-02', '2023-01'])
  })
  it('undated entries fall back to id comparison, not NaN arithmetic', () => {
    const xs = [r('V-2026-06', ''), r('V-2026-01', '')]
    expect(xs.sort(sortResolutions).map((x) => x.id)).toEqual(['V-2026-06', 'V-2026-01'])
  })
  it('acclamations sort after plain resolutions of the same meeting', () => {
    const xs = [
      { id: '2023-01-acclaim-1', meeting_date: '2023-06-01', is_acclamation: true },
      { id: '2023-02', meeting_date: '2023-06-01', is_acclamation: false },
    ]
    expect(xs.sort(sortResolutions).map((x) => x.id)).toEqual(['2023-02', '2023-01-acclaim-1'])
  })
})

describe('buildMeetingRecord', () => {
  it('counts resolutions and acclamations for the meeting', () => {
    const m = buildMeetingRecord('plenary', 'plenary-31', { dates: [{ start: '2023-06-15' }], venue: 'Berlin' }, [
      { is_acclamation: false }, { is_acclamation: false }, { is_acclamation: true },
    ])
    expect(m).toMatchObject({
      source_type: 'plenary',
      source_file: 'plenary-31',
      meeting_date: '2023-06-15',
      year: '2023',
      venue: 'Berlin',
      resolution_count: 3,
      acclamation_count: 1,
    })
  })
})
