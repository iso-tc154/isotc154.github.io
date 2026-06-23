import { describe, it, expect } from 'vitest'
import {
  isOpenForComment,
  partitionByStatus,
  filterOpenForComment,
  latestPublication,
} from './standardsClassification.mjs'

describe('isOpenForComment', () => {
  it('returns false for empty/missing stage', () => {
    expect(isOpenForComment(undefined)).toBe(false)
    expect(isOpenForComment(null)).toBe(false)
    expect(isOpenForComment('')).toBe(false)
  })

  it('returns true for DIS (40.x) and DTR/DTS (50.x) stages', () => {
    expect(isOpenForComment('40.00')).toBe(true)
    expect(isOpenForComment('40.92')).toBe(true)
    expect(isOpenForComment('50.00')).toBe(true)
    expect(isOpenForComment('59.60')).toBe(true)
  })

  it('returns false for pre-balloting and post-balloting stages', () => {
    expect(isOpenForComment('10.99')).toBe(false) // AWI
    expect(isOpenForComment('30.00')).toBe(false) // CD
    expect(isOpenForComment('60.00')).toBe(false) // published
    expect(isOpenForComment('95.99')).toBe(false) // withdrawn
  })

  it('rejects non-numeric stage strings', () => {
    expect(isOpenForComment('DIS')).toBe(false)
    expect(isOpenForComment('n/a')).toBe(false)
  })
})

describe('partitionByStatus', () => {
  const mk = (status, id) => ({
    id,
    iso: { name: id },
    tc154: status ? { status } : undefined,
  })

  it('routes standards into published/withdrawn/underDevelopment buckets', () => {
    const result = partitionByStatus([
      mk('published', 'a'),
      mk('withdrawn', 'b'),
      mk('under_development', 'c'),
    ])
    expect(result.published.map((s) => s.id)).toEqual(['a'])
    expect(result.withdrawn.map((s) => s.id)).toEqual(['b'])
    expect(result.underDevelopment.map((s) => s.id)).toEqual(['c'])
  })

  it('defaults to published when tc154.status is missing', () => {
    const result = partitionByStatus([mk(undefined, 'x')])
    expect(result.published.map((s) => s.id)).toEqual(['x'])
    expect(result.withdrawn).toHaveLength(0)
    expect(result.underDevelopment).toHaveLength(0)
  })

  it('ignores unknown statuses rather than crashing', () => {
    const result = partitionByStatus([mk('rumoured', 'z')])
    expect(result.published).toHaveLength(0)
    expect(result.withdrawn).toHaveLength(0)
    expect(result.underDevelopment).toHaveLength(0)
  })
})

describe('filterOpenForComment', () => {
  const mk = (stage, id) => ({
    id,
    iso: { stage, name: id },
  })

  it('keeps only balloting-stage entries, sorted by stage descending', () => {
    const result = filterOpenForComment([
      mk('30.00', 'cd'),
      mk('40.00', 'dis-a'),
      mk('50.20', 'dtr-b'),
      mk('10.99', 'awi'),
    ])
    expect(result.map((s) => s.id)).toEqual(['dtr-b', 'dis-a'])
  })

  it('returns empty array when nothing is in balloting range', () => {
    const result = filterOpenForComment([mk('10.99', 'a'), mk('60.00', 'b')])
    expect(result).toHaveLength(0)
  })
})

describe('latestPublication', () => {
  const mk = (date, id) => ({
    id,
    iso: { publication_date: date, name: id },
  })

  it('returns the most recent publication by date', () => {
    const result = latestPublication([
      mk('2019-01-01', 'old'),
      mk('2024-06-15', 'new'),
      mk('2021-03-03', 'mid'),
    ])
    expect(result?.id).toBe('new')
  })

  it('skips entries with no publication_date', () => {
    const result = latestPublication([
      mk(undefined, 'undated'),
      mk('2024-06-15', 'dated'),
    ])
    expect(result?.id).toBe('dated')
  })

  it('returns undefined when no entry has a date', () => {
    const result = latestPublication([mk(undefined, 'a'), mk('', 'b')])
    expect(result).toBeUndefined()
  })

  it('does not mutate the input array', () => {
    const input = [mk('2019-01-01', 'a'), mk('2024-06-15', 'b')]
    const original = input.map((s) => s.id)
    latestPublication(input)
    expect(input.map((s) => s.id)).toEqual(original)
  })
})
