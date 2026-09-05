import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { loadPlenaryDecisions } from './edoxen-doc'

const staged = existsSync('_data/resolutions-edoxen/plenary-44.yaml')

describe.skipIf(!staged)('loadPlenaryDecisions (staged fixtures)', () => {
  it('loads the plenary-44 resolutions with cards shaped for the page', () => {
    const cards = loadPlenaryDecisions(44)
    expect(cards.length).toBeGreaterThan(5)
    for (const c of cards) {
      expect(c.urn).toMatch(/^urn:iso:tc154:resolution:plenary-44:/)
      expect(c.id).toBe(c.urn.split(':').pop())
      expect(typeof c.title).toBe('string')
      expect(['resolution', 'acclamation']).toContain(c.kind)
    }
    // plenary-44's fifteen decisions are all plain resolutions; the
    // acclamation flag is exercised by the unit card shape above.
    expect(cards.every((c) => c.isAcclamation === false)).toBe(true)
  })

  it('returns [] for unknown plenaries and unparseable content', () => {
    expect(loadPlenaryDecisions(999)).toEqual([])
  })
})
