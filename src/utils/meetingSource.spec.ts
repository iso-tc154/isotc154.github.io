import { describe, it, expect } from 'vitest'
import {
  parseMeetingSource, meetingSourceKind, meetingSourceFromParts,
  parseMeetingSourceParam, formatMeetingSource, meetingSourceShortTitle,
  meetingSourceOrdinal,
} from './meetingSource'

describe('parseMeetingSource', () => {
  it('parses plenary ordinals and normalizes raw', () => {
    expect(parseMeetingSource('plenary-31')).toEqual({ kind: 'plenary', raw: 'plenary-31', ordinal: 31, year: null })
  })
  it('session suffixes (_2.._9) collapse onto the base ordinal', () => {
    expect(parseMeetingSource('plenary-31_2')).toEqual({ kind: 'plenary', raw: 'plenary-31', ordinal: 31, year: null })
    expect(parseMeetingSource('plenary-31_9')).toEqual({ kind: 'plenary', raw: 'plenary-31', ordinal: 31, year: null })
  })
  it('leading zeros normalize away (_1 is not a session suffix)', () => {
    expect(parseMeetingSource('plenary-031').raw).toBe('plenary-31')
    expect(parseMeetingSource('plenary-31_1')).toBeNull()
    expect(parseMeetingSource('plenary-31_10')).toBeNull()
  })
  it('ballot files parse as year-kind sources', () => {
    expect(parseMeetingSource('ballots-2026')).toEqual({ kind: 'ballots', raw: 'ballots-2026', ordinal: null, year: 2026 })
  })
  it('rejects garbage and empty input', () => {
    expect(parseMeetingSource('')).toBeNull()
    expect(parseMeetingSource('plenary-')).toBeNull()
    expect(parseMeetingSource('plenary-abc')).toBeNull()
    expect(parseMeetingSource('ballots-20')).toBeNull()
    expect(parseMeetingSource('whatever')).toBeNull()
  })
})

describe('meetingSourceKind / meetingSourceFromParts', () => {
  it('kind requires the directory type to agree with the file shape', () => {
    expect(meetingSourceKind('plenary', 'plenary-31')).toBe('plenary')
    expect(meetingSourceKind('ballots', 'ballots-2026')).toBe('ballots')
    expect(meetingSourceKind('plenary', 'ballots-2026')).toBeNull()
    expect(meetingSourceKind('ballots', 'plenary-31')).toBeNull()
    expect(meetingSourceKind('7372ma', 'plenary-31')).toBeNull()
  })
  it('fromParts parses when the pair agrees, null otherwise', () => {
    expect(meetingSourceFromParts('plenary', 'plenary-31_2')?.ordinal).toBe(31)
    expect(meetingSourceFromParts('plenary', 'nope')).toBeNull()
  })
})

describe('parseMeetingSourceParam', () => {
  it('parses type/file query params through the same rules', () => {
    expect(parseMeetingSourceParam('ballots/ballots-2026')?.year).toBe(2026)
  })
  it('rejects malformed params', () => {
    expect(parseMeetingSourceParam(null)).toBeNull()
    expect(parseMeetingSourceParam('plenary')).toBeNull()
    expect(parseMeetingSourceParam('plenary/nope')).toBeNull()
  })
})

describe('display helpers', () => {
  it('short titles render per kind', () => {
    expect(meetingSourceShortTitle({ kind: 'plenary', raw: 'plenary-31', ordinal: 31, year: null })).toBe('31st Plenary Meeting')
    expect(meetingSourceShortTitle({ kind: 'ballots', raw: 'ballots-2026', ordinal: null, year: 2026 })).toBe('2026 Committee Ballots')
    expect(meetingSourceShortTitle({ kind: 'plenary', raw: 'plenary-x', ordinal: null, year: null })).toBe('plenary-x')
  })
  it('format yields raw; ordinal accessor passes through', () => {
    const s = { kind: 'plenary', raw: 'plenary-31', ordinal: 31, year: null }
    expect(formatMeetingSource(s)).toBe('plenary-31')
    expect(meetingSourceOrdinal(s)).toBe(31)
  })
})
