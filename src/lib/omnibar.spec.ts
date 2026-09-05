import { describe, it, expect } from 'vitest'
import { omnibarHits } from './omnibar'

const entries = [
  { t: 'ISO 8601', s: 'Date and time', u: '/standards/iso-8601/', k: 'Standard' },
  { t: '45 plenary', s: 'Berlin, Germany 2026', u: '/meetings/45/', k: 'Meeting' },
  { t: 'Jane Doe', s: 'ACME', u: '/members/jane/', k: 'Member' },
  { t: '8601 ballot', s: '', u: '/decisions/x/', k: 'Resolution' },
]

describe('omnibarHits', () => {
  it('matches case-insensitively over title and subtitle', () => {
    expect(omnibarHits(entries, 'berlin').map((e) => e.u)).toEqual(['/meetings/45/'])
    expect(omnibarHits(entries, 'ISO 86').map((e) => e.u)).toEqual(['/standards/iso-8601/'])
    expect(omnibarHits(entries, 'acme').map((e) => e.u)).toEqual(['/members/jane/'])
  })
  it('caps query results at 10 hits', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ t: `hit ${i}`, u: `/x/${i}/` }))
    expect(omnibarHits(many, 'hit')).toHaveLength(10)
  })
  it('an empty query shows the first 6 entries, not zero', () => {
    const many = Array.from({ length: 25 }, (_, i) => ({ t: `entry ${i}`, u: `/x/${i}/` }))
    expect(omnibarHits(many, '')).toHaveLength(6)
    expect(omnibarHits(many, '   ')).toHaveLength(6)
  })
  it('a query matching nothing yields an empty list', () => {
    expect(omnibarHits(entries, 'zzz')).toEqual([])
  })
})
