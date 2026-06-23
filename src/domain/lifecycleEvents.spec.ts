import { describe, it, expect } from 'vitest'
import {
  LIFECYCLE_EVENT_PRESENTATION,
  markerOf,
} from './lifecycleEvents'
import type { LifecycleEventType } from '../types/group'

const ALL_TYPES: LifecycleEventType[] = [
  'established',
  'dissolved',
  'convenor_appointed',
  'convenor_extended',
  'scope_change',
  'succession',
  'title_change',
  'note',
]

describe('LIFECYCLE_EVENT_PRESENTATION', () => {
  it('has an entry for every LifecycleEventType', () => {
    for (const t of ALL_TYPES) {
      expect(LIFECYCLE_EVENT_PRESENTATION[t]).toBeDefined()
      expect(typeof LIFECYCLE_EVENT_PRESENTATION[t].glyph).toBe('string')
      expect(typeof LIFECYCLE_EVENT_PRESENTATION[t].label).toBe('string')
      expect(LIFECYCLE_EVENT_PRESENTATION[t].glyph.length).toBeGreaterThan(0)
      expect(LIFECYCLE_EVENT_PRESENTATION[t].label.length).toBeGreaterThan(0)
    }
  })

  it('uses distinct glyphs across types so the timeline rail is scannable', () => {
    const glyphs = ALL_TYPES.map((t) => LIFECYCLE_EVENT_PRESENTATION[t].glyph)
    expect(new Set(glyphs).size).toBe(glyphs.length)
  })
})

describe('markerOf', () => {
  it('returns the registered marker for each known type', () => {
    expect(markerOf('established')).toEqual({ glyph: '◇', label: 'Established' })
    expect(markerOf('dissolved')).toEqual({ glyph: '✕', label: 'Dissolved' })
    expect(markerOf('succession')).toEqual({ glyph: '⇄', label: 'Succession' })
  })

  it('returns a fallback marker for an unknown type', () => {
    const result = markerOf('unknown' as LifecycleEventType)
    expect(result.glyph).toBe('·')
    expect(typeof result.label).toBe('string')
    expect(result.label.length).toBeGreaterThan(0)
  })
})
