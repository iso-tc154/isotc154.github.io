import type { Resolution } from '../types/resolution'
import type { MeetingSource } from './meetingSource'
import { meetingSourceFromParts } from './meetingSource'

export type ResolutionSortOrder = 'newest' | 'oldest' | 'most_actions'

export interface ResolutionsFilter {
  searchQuery: string
  selectedYear: string
  selectedActionTypes: Set<string>
  sortOrder: ResolutionSortOrder
  meeting: MeetingSource | null
}

export function resolutionYears(resolutions: readonly Resolution[]): string[] {
  const years = new Set<string>()
  for (const r of resolutions) {
    if (r.year) years.add(r.year)
  }
  return Array.from(years).sort((a, b) => b.localeCompare(a))
}

export function resolutionYearRange(resolutions: readonly Resolution[]): { earliest: string; latest: string } {
  if (!resolutions.length) return { earliest: '', latest: '' }
  const years = resolutions.map((r) => parseInt(r.year, 10)).filter((y) => !isNaN(y))
  if (!years.length) return { earliest: '', latest: '' }
  return { earliest: String(Math.min(...years)), latest: String(Math.max(...years)) }
}

export function uniqueActionTypes(resolution: Resolution): string[] {
  if (!resolution.actions) return []
  const types = new Set<string>()
  for (const a of resolution.actions) {
    if (a.type) types.add(a.type)
  }
  return Array.from(types)
}

export function topActionTypes(resolutions: readonly Resolution[], limit = 8): string[] {
  if (!resolutions.length) return []
  const counts: Record<string, number> = {}
  for (const r of resolutions) {
    if (!r.actions) continue
    for (const a of r.actions) {
      if (a.type) counts[a.type] = (counts[a.type] || 0) + 1
    }
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map((e) => e[0])
}

export function allActionTypes(resolutions: readonly Resolution[]): string[] {
  if (!resolutions.length) return []
  const types = new Set<string>()
  for (const r of resolutions) {
    if (!r.actions) continue
    for (const a of r.actions) {
      if (a.type) types.add(a.type)
    }
  }
  return Array.from(types).sort()
}

export function filterResolutions(
  resolutions: readonly Resolution[],
  filter: ResolutionsFilter,
  searchFn?: (q: string) => Resolution[],
): Resolution[] {
  let list: Resolution[] = [...resolutions]

  if (filter.meeting) {
    const mf = filter.meeting
    list = list.filter((r) => {
      const rs = meetingSourceFromParts(r.source_type, r.source_file)
      return rs !== null && rs.kind === mf.kind && rs.raw === mf.raw
    })
  }

  if (filter.selectedYear) {
    list = list.filter((r) => r.year === filter.selectedYear)
  }

  if (filter.selectedActionTypes.size > 0) {
    const sel = filter.selectedActionTypes
    list = list.filter((r) => {
      const types = uniqueActionTypes(r)
      return types.some((t) => sel.has(t))
    })
  }

  const q = filter.searchQuery.trim()
  if (q) {
    if (searchFn) {
      const matched = searchFn(q)
      if (matched.length > 0) {
        const ids = new Set(matched.map((r) => r.id))
        list = list.filter((r) => ids.has(r.id))
      } else {
        list = list.filter((r) => matchesQueryLazy(r, q))
      }
    } else {
      const qLower = q.toLowerCase()
      list = list.filter((r) => matchesQueryLazy(r, qLower))
    }
  }

  return sortResolutions(list, filter.sortOrder)
}

function matchesQueryLazy(r: Resolution, q: string): boolean {
  const qLower = q.toLowerCase()
  return (
    (!!r.title && r.title.toLowerCase().includes(qLower)) ||
    (!!r.id && r.id.toLowerCase().includes(qLower)) ||
    (!!r.subject && r.subject.toLowerCase().includes(qLower)) ||
    (!!r.venue && r.venue.toLowerCase().includes(qLower))
  )
}

export function sortResolutions(
  list: Resolution[],
  order: ResolutionSortOrder,
): Resolution[] {
  if (order === 'oldest') {
    return list.sort(
      (a, b) => (a.year || '').localeCompare(b.year || '') || a.id.localeCompare(b.id),
    )
  }
  if (order === 'most_actions') {
    return list.sort((a, b) => {
      const aCount = a.actions ? a.actions.length : 0
      const bCount = b.actions ? b.actions.length : 0
      return bCount - aCount || (b.year || '').localeCompare(a.year || '')
    })
  }
  return list.sort(
    (a, b) => (b.year || '').localeCompare(a.year || '') || b.id.localeCompare(a.id),
  )
}
