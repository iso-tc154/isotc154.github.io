import type { MeetingSession } from '../types/meeting'

export function resolutionTypeLabel(sourceType: string): string {
  if (sourceType === 'plenary') return 'Plenary'
  if (sourceType === 'ballots') return 'Ballot'
  return sourceType ? sourceType.charAt(0).toUpperCase() + sourceType.slice(1) : ''
}

export function formatSessionDate(raw: string): string {
  const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:\s+(\d{1,2}:\d{2})(?:\s+([A-Z]+))?)?$/)
  if (!m) return raw
  const [, d, mon, y, time, tz] = m
  const tzSuffix = tz && tz !== 'UTC' ? ` ${tz}` : ''
  if (time && !(time === '00:00')) return `${d} ${mon} ${y}, ${time}${tzSuffix}`
  return `${d} ${mon} ${y}`
}

export function sessionLabel(s: MeetingSession): string {
  const parts: string[] = []
  if (s.start_date) parts.push(formatSessionDate(s.start_date))
  if (s.end_date && s.end_date !== s.start_date) parts.push(formatSessionDate(s.end_date))
  return parts.join(' – ')
}

export function sessionLocation(s: MeetingSession): string {
  const parts: string[] = []
  if (s.city) parts.push(s.city.replace(/[,;]\s*$/, ''))
  if (s.country && s.country !== s.city) parts.push(s.country)
  return parts.join(' · ')
}

export function sessionVirtual(s: MeetingSession): string | null {
  if (!s.virtual_address) return null
  const v = s.virtual_address.toLowerCase()
  if (v === 'zoom' || v === 'teams' || v === 'online') return null
  return s.virtual_address
}

const ASSOC_ROLE_LABELS: Record<string, string> = {
  'co-organizer': 'Co-organizer',
  'cohost': 'Co-host',
  'co-host': 'Co-host',
  'host': 'Host',
  'sponsor': 'Sponsor',
  'secretariat': 'Secretariat',
  'technical-advisor': 'Technical advisor',
  'partner': 'Partner',
}

export function associateRoleLabel(role?: string): string {
  if (!role) return ''
  return ASSOC_ROLE_LABELS[role.toLowerCase()] || role.replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}
