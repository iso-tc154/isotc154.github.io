import { describe, it, expect } from 'vitest'
import { toISODate, toNullableISODate } from './dates.mjs'

describe('toISODate', () => {
  it('returns empty string for null/undefined/empty', () => {
    expect(toISODate(null)).toBe('')
    expect(toISODate(undefined)).toBe('')
    expect(toISODate('')).toBe('')
  })

  it('normalises a JS Date (from YAML auto-parse) to YYYY-MM-DD', () => {
    const d = new Date(Date.UTC(2013, 9, 28))
    expect(toISODate(d)).toBe('2013-10-28')
  })

  it('passes through an ISO date string unchanged', () => {
    expect(toISODate('2013-10-28')).toBe('2013-10-28')
  })

  it('truncates a datetime string to the date component', () => {
    expect(toISODate('2013-10-28T11:30:00.000Z')).toBe('2013-10-28')
  })

  it('handles {date, precision} hashes from member role records', () => {
    expect(toISODate({ date: '2023-10-27', precision: 'day' })).toBe('2023-10-27')
  })

  it('handles nested {date} containing a JS Date', () => {
    const d = new Date(Date.UTC(2018, 8, 1))
    expect(toISODate({ date: d, precision: 'month' })).toBe('2018-09-01')
  })

  it('coerces other primitives to a string then truncates', () => {
    expect(toISODate(20131028)).toBe('20131028')
  })
})

describe('toNullableISODate', () => {
  it('returns null for empty input', () => {
    expect(toNullableISODate(null)).toBeNull()
    expect(toNullableISODate(undefined)).toBeNull()
    expect(toNullableISODate('')).toBeNull()
  })

  it('returns the YYYY-MM-DD form otherwise', () => {
    expect(toNullableISODate('2013-10-28')).toBe('2013-10-28')
    expect(toNullableISODate(new Date(Date.UTC(2013, 9, 28)))).toBe('2013-10-28')
  })
})
