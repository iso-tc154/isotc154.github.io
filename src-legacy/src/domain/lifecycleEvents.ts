import type { LifecycleEventType } from '../types/group'

// Presentation map for lifecycle events on the group timeline.
//
// Each lifecycle event type has a glyph (rendered in the timeline rail) and
// a human-readable label (rendered in the card metadata row). This is the
// single source of truth — both GroupTimeline.vue and any future surface
// (badges, exports, accessibility alt-text) read from this map.

export interface LifecycleMarker {
  glyph: string
  label: string
}

export const LIFECYCLE_EVENT_PRESENTATION: Record<LifecycleEventType, LifecycleMarker> = {
  established:        { glyph: '◇', label: 'Established' },
  dissolved:          { glyph: '✕', label: 'Dissolved' },
  convenor_appointed: { glyph: '●', label: 'Convenor appointed' },
  convenor_extended:  { glyph: '◐', label: 'Term extended' },
  scope_change:       { glyph: '✎', label: 'Scope change' },
  succession:         { glyph: '⇄', label: 'Succession' },
  title_change:       { glyph: '“', label: 'Title change' },
  note:               { glyph: '✦', label: 'Note' },
}

const FALLBACK_MARKER: LifecycleMarker = { glyph: '·', label: 'Event' }

export function markerOf(type: LifecycleEventType): LifecycleMarker {
  return LIFECYCLE_EVENT_PRESENTATION[type] ?? FALLBACK_MARKER
}
