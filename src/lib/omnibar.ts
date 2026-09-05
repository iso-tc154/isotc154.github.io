export interface OmnibarEntry {
  t: string
  s?: string
  u: string
  k?: string
}

/**
 * Hit selection for the ⌘K omnibar: case-insensitive substring match over
 * title + subtitle, capped at 10; an empty query shows the first 6 entries.
 */
export function omnibarHits(entries: OmnibarEntry[], query: string): OmnibarEntry[] {
  const needle = query.trim().toLowerCase()
  return needle
    ? entries.filter((e) => (e.t + ' ' + (e.s ?? '')).toLowerCase().includes(needle)).slice(0, 10)
    : entries.slice(0, 6)
}
