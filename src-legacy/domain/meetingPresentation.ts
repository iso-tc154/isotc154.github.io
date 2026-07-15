// Meeting display and aggregation helpers.
//
// Pure functions for the meetings list: status classification
// (upcoming vs concluded vs cancelled), decade bucketing, label
// formatting, type initials, and the decade-grouped shape the
// MeetingsListView renders.

import type { Meeting } from '../types/meeting'

// A meeting is "upcoming" when its status_label is anything other
// than the two terminal states. New status strings added by ISO
// will default to "upcoming" by design — better to show a tentative
// meeting than silently hide it.
export function isUpcoming(m: Meeting): boolean {
  return m.status_label !== 'Concluded' && m.status_label !== 'Cancelled'
}

export function isConcluded(m: Meeting): boolean {
  return m.status_label === 'Concluded'
}

export function isCancelled(m: Meeting): boolean {
  return m.status_label === 'Cancelled'
}

// Floor a year to its decade (e.g. 1987 → 1980). Returns null when
// the year is missing or non-numeric.
export function decadeOf(year: number | null | undefined): number | null {
  if (year == null) return null
  const y = Number(year)
  if (isNaN(y)) return null
  return Math.floor(y / 10) * 10
}

export function decadeLabel(d: number): string {
  return `${d}s`
}

// Short badge text for the meeting type. Used in card headers
// where the full type_label would be too long.
export function typeInitials(m: Meeting): string {
  if (m.type_label === 'Hybrid') return 'HYB'
  if (m.type_label === 'Virtual') return 'VRT'
  if (m.type_label === 'In person') return 'F2F'
  return m.type_label.slice(0, 3).toUpperCase()
}

export interface DecadeGroup {
  decade: number
  label: string
  meetings: Meeting[]
  resolutionCount: number
}

// Bucket meetings by decade, sorted newest-decade-first. Meetings
// without a year are dropped. Within each decade, meetings sort
// newest-ordinal-first.
export function groupByDecade(meetings: Meeting[]): DecadeGroup[] {
  const map = new Map<number, Meeting[]>()
  for (const m of meetings) {
    const d = decadeOf(m.year)
    if (d === null) continue
    if (!map.has(d)) map.set(d, [])
    map.get(d)!.push(m)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0] - a[0])
    .map(([decade, ms]) => ({
      decade,
      label: decadeLabel(decade),
      meetings: ms.slice().sort((a, b) => b.ordinal - a.ordinal),
      resolutionCount: ms.reduce((acc, m) => acc + (m.resolution_count || 0), 0),
    }))
}

// Distinct decades present, sorted descending. Used to build the
// decade filter chip rail.
export function decadeFacets(meetings: Meeting[]): number[] {
  const set = new Set<number>()
  for (const m of meetings) {
    const d = decadeOf(m.year)
    if (d !== null) set.add(d)
  }
  return Array.from(set).sort((a, b) => b - a)
}

// Flatten a list of meetings into a single search haystack string.
// Fields chosen to match what the meetings list view searches:
// ordinal, year, location label, and every session's country, city,
// and virtual address.
export function searchHaystack(m: Meeting): string {
  return [
    String(m.ordinal),
    m.year ? String(m.year) : '',
    m.location_label,
    ...m.sessions.map((s) => [s.country, s.city, s.virtual_address].filter(Boolean).join(' ')),
  ]
    .join(' ')
    .toLowerCase()
}
