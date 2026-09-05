import { describe, it, expect } from 'vitest'
import { localized, normalizeDecision } from './resolutions.mjs'

describe('localized (edoxen array → legacy string)', () => {
  it('flattens [{spelling, value}] to the first value', () => {
    expect(localized([{ spelling: 'eng', value: 'Title' }])).toBe('Title')
  })
  it('value key present but nullish flattens to empty string; plain values pass through', () => {
    expect(localized([{ value: null }])).toBe('')
    expect(localized([{ value: undefined }])).toBe('')
    expect(localized([{ spelling: 'eng', value: 'x' }])).toBe('x')
    expect(localized('plain')).toBe('plain')
    expect(localized(undefined)).toBe(undefined)
  })
})

describe('normalizeDecision', () => {
  it('flattens every localized field and action message', () => {
    const out = normalizeDecision({
      identifier: [{ number: '2023-01' }],
      title: [{ value: 'T' }],
      subject: [{ value: 'S' }],
      actions: [{ message: [{ value: 'A' }] }],
      considerations: [{ message: [{ value: 'C' }] }],
      approvals: [{ message: [{ value: 'P' }] }],
    })
    expect(out).toMatchObject({
      identifier: '2023-01',
      title: 'T',
      subject: 'S',
      actions: [{ message: 'A' }],
      considerations: [{ message: 'C' }],
      approvals: [{ message: 'P' }],
    })
  })
  it('identifier degrades from array-without-number, and from a scalar, to a string', () => {
    expect(normalizeDecision({ identifier: [{ prefix: 'ISO/TC 154' }] }).identifier).toBe('[object Object]')
    expect(normalizeDecision({ identifier: 42 }).identifier).toBe(42)
  })
  it('keeps unknown fields verbatim (spread passthrough)', () => {
    expect(normalizeDecision({ custom: 'keep' }).custom).toBe('keep')
  })
  it('absent collections become empty arrays', () => {
    const out = normalizeDecision({ identifier: '1' })
    expect(out.actions).toEqual([])
    expect(out.considerations).toEqual([])
    expect(out.approvals).toEqual([])
  })
})
