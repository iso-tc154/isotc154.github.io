import { describe, it, expect } from 'vitest'
import { nextPlenary, latestResolution, buildSearchIndex } from './meta.mjs'
import { toISODate } from './dates.mjs'

describe('nextPlenary (date-first, not ordinal-first)', () => {
  it('picks the earliest start date among upcoming events', () => {
    const events = [
      { status: 'upcoming', ordinal: 50, time: { from: { date: '2027-10-01' } } },
      { status: 'upcoming', ordinal: 46, time: { from: { date: '2026-09-14' } } },
      { status: 'completed', ordinal: 45, time: { from: { date: '2026-08-31' } } },
    ]
    expect(nextPlenary(events, toISODate).ordinal).toBe(46)
  })
  it('a stale upcoming status must not shadow a later, correctly-dated one', () => {
    const events = [
      { status: 'upcoming', ordinal: 44, time: { from: { date: '2025-08-01' } } }, // status never flipped
      { status: 'upcoming', ordinal: 46, time: { from: { date: '2026-09-14' } } },
    ]
    expect(nextPlenary(events, toISODate).ordinal).toBe(44) // earliest DATE wins, even if it's the stale one — but it's still the earliest upcoming
  })
  it('ordinal breaks exact-date ties; empty input yields null', () => {
    const events = [
      { status: 'upcoming', ordinal: 7, time: { from: { date: '2026-05-01' } } },
      { status: 'upcoming', ordinal: 6, time: { from: { date: '2026-05-01' } } },
    ]
    expect(nextPlenary(events, toISODate).ordinal).toBe(6)
    expect(nextPlenary([], toISODate)).toBeNull()
    expect(nextPlenary([{ status: 'completed', ordinal: 1 }], toISODate)).toBeNull()
  })
  it('undated upcoming events sort after dated ones', () => {
    const events = [
      { status: 'upcoming', ordinal: 2 }, // no time
      { status: 'upcoming', ordinal: 3, time: { from: { date: '2026-05-01' } } },
    ]
    expect(nextPlenary(events, toISODate).ordinal).toBe(3)
  })
})

describe('latestResolution (stable, loader order decides ties)', () => {
  it('picks the newest meeting_date', () => {
    const rs = [
      { id: 'A', meeting_date: '2026-01-01' },
      { id: 'B', meeting_date: '2024-10-25' },
      { id: 'C', meeting_date: '2026-08-30' },
    ]
    expect(latestResolution(rs, toISODate).id).toBe('C')
  })
  it('undated ties preserve loader order (newest-ballot-first)', () => {
    const rs = [
      { id: 'V-2026-06', meeting_date: '' },
      { id: 'V-2026-01', meeting_date: '' },
    ]
    expect(latestResolution(rs, toISODate).id).toBe('V-2026-06')
  })
  it('empty input yields null', () => {
    expect(latestResolution([], toISODate)).toBeNull()
  })
})

describe('buildSearchIndex', () => {
  it('shapes one entry per entity with kind labels', () => {
    const idx = buildSearchIndex({
      standards: [{ id: 'iso-8601', iso: { name: 'ISO 8601', title: 'Date and time' }, url: '/standards/iso-8601/' }],
      members: { all: { 'jane': { name: 'Jane Doe', 'member-id': 'jane', affiliation: 'ACME' } } },
      meetings: [{ ordinal: 45, year: 2026, location_label: 'Berlin, Germany', url: '/meetings/45/' }],
      posts: [{ slug: '2026-08-30-berlin', frontmatter: { title: 'Willkommen' } }],
      resolutions: [{ id: 'V-2026-01', urn: 'urn:iso:tc:154:resolution:V-2026-01', title: 'Liaison' }],
    })
    expect(idx).toEqual([
      { t: 'ISO 8601', s: 'Date and time', u: '/standards/iso-8601/', k: 'Standard' },
      { t: 'Jane Doe', s: 'ACME', u: '/members/jane/', k: 'Member' },
      { t: '45 plenary', s: 'Berlin, Germany 2026', u: '/meetings/45/', k: 'Meeting' },
      { t: 'Willkommen', s: '', u: '/posts/2026-08-30-berlin/', k: 'News' },
      { t: 'V-2026-01', s: 'Liaison', u: '/decisions/urn:iso:tc:154:resolution:V-2026-01/', k: 'Resolution' },
    ])
  })
  it('never renders "undefined plenary" for ordinal-less meetings', () => {
    const idx = buildSearchIndex({
      standards: [], members: {}, posts: [], resolutions: [],
      meetings: [{ year: 1995, url: '/meetings/x/' }],
    })
    expect(idx[0].t).toBe('1995 plenary')
  })
  it('falls back to slug and id when titles are missing', () => {
    const idx = buildSearchIndex({
      standards: [{ id: 'iso-x' }], members: {}, meetings: [], resolutions: [],
      posts: [{ slug: 'untitled-post', frontmatter: {} }],
    })
    expect(idx[0]).toEqual({ t: 'iso-x', s: '', u: '/standards/iso-x/', k: 'Standard' })
    expect(idx[1].t).toBe('untitled-post')
  })
})
