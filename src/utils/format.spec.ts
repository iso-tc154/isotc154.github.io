import { describe, it, expect } from 'vitest'
import { formatDate, formatDatePrecision, formatDateShort } from './format'

describe('formatDatePrecision', () => {
  it('returns empty string for empty input', () => {
    expect(formatDatePrecision('')).toBe('')
  })

  it('formats day precision as "Mon D, YYYY"', () => {
    expect(formatDatePrecision('2024-10-18', 'day')).toBe('Oct 18, 2024')
  })

  it('formats month precision as "Mon YYYY"', () => {
    expect(formatDatePrecision('2024-10-18', 'month')).toBe('Oct 2024')
  })

  it('formats year precision as "YYYY"', () => {
    expect(formatDatePrecision('2024-10-18', 'year')).toBe('2024')
  })

  it('defaults to day precision when precision is absent', () => {
    expect(formatDatePrecision('2024-10-18')).toBe('Oct 18, 2024')
  })

  it('falls back to raw input for unparseable strings', () => {
    expect(formatDatePrecision('not-a-date', 'day')).toBe('not-a-date')
  })

  it('uses UTC (no off-by-one for date-only strings)', () => {
    expect(formatDatePrecision('2024-01-15', 'day')).toBe('Jan 15, 2024')
  })
})

describe('formatDate', () => {
  it('returns long-form date', () => {
    expect(formatDate('2024-10-18')).toBe('October 18, 2024')
  })

  it('returns empty for empty input', () => {
    expect(formatDate('')).toBe('')
  })
})

describe('formatDateShort', () => {
  it('returns month + day only', () => {
    expect(formatDateShort('2024-10-18')).toBe('Oct 18')
  })
})
