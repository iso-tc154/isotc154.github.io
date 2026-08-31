// Resolution display and aggregation helpers.
//
// Pure functions that turn raw Resolution records into the shapes
// the resolution views render and filter on: unique action types
// per resolution, action-type facets across the corpus, year facets
// and year range, and stable sort comparators. Kept dependency-free
// so build scripts and Vue components can both call them.

import type { Resolution } from '../types/resolution'

export type ResolutionSortOrder = 'newest' | 'oldest' | 'most_actions'

// Distinct action.type values on a single resolution, stable order
// (first appearance in the resolution's actions array). Returns
// [] when the resolution has no actions.
export function uniqueActionTypes(res: Resolution): string[] {
  if (!res.actions) return []
  const seen = new Set<string>()
  const out: string[] = []
  for (const a of res.actions) {
    if (a && a.type && !seen.has(a.type)) {
      seen.add(a.type)
      out.push(a.type)
    }
  }
  return out
}

// Action-type facets across a corpus: every distinct type (sorted),
// and the top-N by descending frequency. Both used by the
// resolutions list to build the filter chip rail.
export interface ActionTypeFacets {
  all: string[]
  top: string[]
}

export function actionTypeFacets(resolutions: Resolution[], topN = 8): ActionTypeFacets {
  const counts = new Map<string, number>()
  for (const r of resolutions) {
    for (const t of uniqueActionTypes(r)) {
      counts.set(t, (counts.get(t) ?? 0) + 1)
    }
  }
  const all = Array.from(counts.keys()).sort()
  const top = Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, topN)
    .map((e) => e[0])
  return { all, top }
}

// Year facets: distinct years present, sorted descending (newest
// first). Excludes empty / missing years.
export function yearFacets(resolutions: Resolution[]): string[] {
  const set = new Set<string>()
  for (const r of resolutions) {
    if (r.year) set.add(r.year)
  }
  return Array.from(set).sort((a, b) => b.localeCompare(a))
}

// Min and max year present in the corpus. Returns empty strings
// when no resolution carries a year.
export function yearRange(resolutions: Resolution[]): { earliest: string; latest: string } {
  if (!resolutions.length) return { earliest: '', latest: '' }
  const years: number[] = []
  for (const r of resolutions) {
    const y = parseInt(r.year, 10)
    if (!isNaN(y)) years.push(y)
  }
  if (!years.length) return { earliest: '', latest: '' }
  return { earliest: String(Math.min(...years)), latest: String(Math.max(...years)) }
}

// In-place comparator factory. Stable: secondary sort by id keeps
// the order deterministic when year matches.
export function compareResolutions(order: ResolutionSortOrder): (a: Resolution, b: Resolution) => number {
  if (order === 'oldest') {
    return (a, b) =>
      (a.year || '').localeCompare(b.year || '') || a.id.localeCompare(b.id)
  }
  if (order === 'most_actions') {
    return (a, b) => {
      const ac = a.actions ? a.actions.length : 0
      const bc = b.actions ? b.actions.length : 0
      return bc - ac || (b.year || '').localeCompare(a.year || '')
    }
  }
  // newest (default)
  return (a, b) =>
    (b.year || '').localeCompare(a.year || '') || b.id.localeCompare(a.id)
}

// Search resolutions by free-text query against the same fields the
// list view already searches (title, id, subject, venue). Returns
// the matching subset; empty input returns []. Comparison is
// case-insensitive substring.
export function searchResolutions(resolutions: Resolution[], query: string): Resolution[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return resolutions.filter((r) =>
    (r.title && r.title.toLowerCase().includes(q)) ||
    (r.id && r.id.toLowerCase().includes(q)) ||
    (r.subject && r.subject.toLowerCase().includes(q)) ||
    (r.venue && r.venue.toLowerCase().includes(q)),
  )
}
