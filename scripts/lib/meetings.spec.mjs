import { describe, it, expect } from 'vitest'
import {
  parseLocalDateTime,
  meetingDateRange,
  meetingLocation,
  statusLabelFor,
  typeLabelFor,
} from './meetings.mjs'

describe('parseLocalDateTime (xlsx export format)', () => {
  it('parses "31 Aug 2026 00:00 CEST"', () => {
    const p = parseLocalDateTime('31 Aug 2026 00:00 CEST')
    expect(p).toMatchObject({ year: 2026, monthNum: 8, day: 31, time: '00:00', tz: 'CEST', isMidnight: true })
    expect(p.sortable).toBe('2026-08-31 00:00')
  })
  it('parses without a timezone and rejects garbage', () => {
    expect(parseLocalDateTime('4 Sep 2026 23:59')).toMatchObject({ tz: '', isEndOfDay: true })
    expect(parseLocalDateTime('whenever')).toBeNull()
    expect(parseLocalDateTime('')).toBeNull()
    expect(parseLocalDateTime(null)).toBeNull()
  })
})

describe('meetingDateRange', () => {
  it('full-day single date renders long-form without times', () => {
    expect(meetingDateRange({ start_date: '2 Oct 2019 00:00', end_date: '2 Oct 2019 23:59' }))
      .toBe('October 2, 2019')
  })
  it('same-day with real times keeps the window', () => {
    expect(meetingDateRange({ start_date: '2 Oct 2019 09:30', end_date: '2 Oct 2019 17:00 CEST' }))
      .toBe('October 2, 2019 · 09:30–17:00 CEST')
  })
  it('multi-day within a month collapses to day – day, year', () => {
    expect(meetingDateRange({ start_date: '31 Aug 2026 00:00', end_date: '4 Sep 2026 23:59' }))
      .toBe('31 Aug – 4 Sep, 2026')
  })
  it('multi-day across months/years uses full dates', () => {
    expect(meetingDateRange({ start_date: '28 Dec 2024 00:00', end_date: '3 Jan 2025 23:59' }))
      .toBe('28 Dec 2024 – 3 Jan 2025')
  })
})

describe('meetingLocation', () => {
  it('joins city and country, trimming trailing punctuation', () => {
    expect(meetingLocation({ city: 'Berlin,', country: 'Germany' })).toBe('Berlin · Germany')
  })
  it('skips country equal to city and generic zoom addresses', () => {
    expect(meetingLocation({ city: 'Berlin', country: 'Berlin' })).toBe('Berlin')
    expect(meetingLocation({ virtual_address: 'Zoom' })).toBe('')
    expect(meetingLocation({ virtual_address: 'https://zoom.us/j/123' })).toBe('Online · https://zoom.us/j/123')
  })
})

describe('statusLabelFor', () => {
  it('cancelled dominates', () => {
    expect(statusLabelFor([{ status: 'closed' }, { status: 'cancelled' }])).toBe('Cancelled')
  })
  it('live statuses beat the primary', () => {
    expect(statusLabelFor([{ status: 'closed' }, { status: 'registration-open' }])).toBe('Registration open')
  })
  it('falls back to the primary session label', () => {
    expect(statusLabelFor([{ status: 'closed' }])).toBe('Concluded')
    expect(statusLabelFor([])).toBe('')
  })
})

describe('typeLabelFor', () => {
  it('any hybrid session makes the meeting hybrid', () => {
    expect(typeLabelFor([{ type: 'face-to-face' }, { type: 'hybrid' }])).toBe('Hybrid')
  })
  it('all-virtual is Virtual, all-f2f is In person', () => {
    expect(typeLabelFor([{ type: 'virtual' }, { type: 'virtual' }])).toBe('Virtual')
    expect(typeLabelFor([{ type: 'face-to-face' }])).toBe('In person')
  })
  it('mixed f2f/virtual defers to the primary type', () => {
    expect(typeLabelFor([{ type: 'face-to-face' }, { type: 'virtual' }])).toBe('In person')
  })
})
