// Meeting-page display language: practical-info labels and the tourist
// section's data shape. Kept here (not in the page) so every meeting page
// renders the same vocabulary and no raw YAML key can reach the page.
import type { AgendaItem, AgendaSession, MeetingSession, RichMeeting } from './data'

const LABEL_OVERRIDES: Record<string, string> = {
  eu_schengen: 'EU Schengen',
  info_url: 'Information URL',
  invitation_contact: 'Invitation Contact',
  invitation_email: 'Invitation email',
  required_info: 'Required information',
  badge_required: 'Badge required',
  badge_info: 'Badge',
  wifi: 'Wi-Fi',
  smoking: 'Smoking',
  electrical: 'Electrical',
  url: 'URL',
}

export function practicalLabel(key: string): string {
  if (LABEL_OVERRIDES[key]) return LABEL_OVERRIDES[key]
  return key.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export interface TouristItem {
  name: string
  link?: string
  notes?: string
}

// Canonical schema: a list of {name, link?, notes?}. A map form
// ({ museums_url: 'https://…' }) is normalized through practicalLabel so
// snake_case keys can never be rendered verbatim.
export function touristItems(value: unknown): TouristItem[] {
  if (Array.isArray(value)) {
    return value.flatMap((item): TouristItem[] => {
      if (typeof item !== 'object' || item === null) return []
      const { name, link, notes } = item as Record<string, unknown>
      if (!name && !link && !notes) return []
      return [{
        name: typeof name === 'string' && name ? name : 'See link',
        link: isUrl(link) ? link : undefined,
        notes: typeof notes === 'string' && notes ? notes : undefined,
      }]
    })
  }
  if (typeof value === 'object' && value !== null) {
    return Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v != null && v !== '')
      .map(([key, v]): TouristItem => {
        if (typeof v === 'object' && v !== null) {
          const { link, notes } = v as Record<string, unknown>
          return {
            name: practicalLabel(key),
            link: isUrl(link) ? link : undefined,
            notes: typeof notes === 'string' ? notes : undefined,
          }
        }
        return {
          name: practicalLabel(key),
          link: isUrl(v) ? v : undefined,
          notes: typeof v === 'string' && !isUrl(v) ? v : undefined,
        }
      })
  }
  return []
}

// ── Practical-info rendering (label/value/section/list shapes) ──
export type PV = string | string[] | Record<string, unknown> | boolean

export const isSection = (v: PV): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)
export const isStringList = (v: PV): v is string[] => Array.isArray(v)
export const isUrl = (v: unknown): v is string => typeof v === 'string' && /^https?:\/\//.test(v)
export const isEmail = (v: unknown): v is string => typeof v === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export function practicalEntries(info: Record<string, unknown> | undefined): [string, PV][] {
  if (!info) return []
  return Object.entries(info).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0)) as [string, PV][]
}

export function sectionEntries(section: Record<string, unknown>): [string, PV][] {
  return Object.entries(section).filter(([, v]) => v != null && v !== '' && !(Array.isArray(v) && v.length === 0) && !(typeof v === 'boolean' && v === false)) as [string, PV][]
}

export function rateLabel(key: string): string {
  return key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Sessions ──
export function formatSessionDate(raw: string): string {
  const m = raw.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})(?:\s+(\d{1,2}:\d{2})(?:\s+([A-Z]+))?)?$/)
  if (!m) return raw
  return `${m[1]} ${m[2]} ${m[3]}${m[4] ? ` ${m[4]}` : ''}${m[5] && m[5] !== 'UTC' ? ` ${m[5]}` : ''}`
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
}

export function associateRoleLabel(role?: string): string {
  if (!role) return ''
  return ASSOC_ROLE_LABELS[role.toLowerCase()] || role.replace(/[_-]+/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// ── Venue ──
export function venueMapUrl(v: { lat?: number; lon?: number } | undefined): string | null {
  if (!v || v.lat == null || v.lon == null) return null
  return `https://www.openstreetmap.org/?mlat=${v.lat}&mlon=${v.lon}#map=16/${v.lat}/${v.lon}`
}

export function venueEmbedSrc(v: { lat?: number; lon?: number } | undefined): string | null {
  if (!v || v.lat == null || v.lon == null) return null
  const d = 0.008
  return `https://www.openstreetmap.org/export/embed.html?bbox=${(v.lon - d).toFixed(6)}%2C${(v.lat - d).toFixed(6)}%2C${(v.lon + d).toFixed(6)}%2C${(v.lat + d).toFixed(6)}&layer=mapnik&marker=${v.lat}%2C${v.lon}`
}

// ── Agenda flattening (port of src-legacy/src/domain/agenda.ts) ──
export interface FlatRow { seq: string; title: string; responsible: string; ref: string; depth: number }

export function parseLeadingSeq(title: string): { seq: string; title: string } {
  const m = title.match(/^(\d+(?:\.\d+)*)\s+(.+)$/)
  return m ? { seq: m[1], title: m[2] } : { seq: '', title }
}

export const cleanResponsible = (s?: string) => (s ? s.replace(/_/g, ' ') : '')

export function flattenAgenda(items: AgendaItem[] | undefined, depth = 0): FlatRow[] {
  const out: FlatRow[] = []
  if (!items) return out
  for (const item of items) {
    const parsed = parseLeadingSeq(item.title)
    const seq = item.number != null ? String(item.number) : parsed.seq
    const title = item.number != null ? item.title : parsed.title
    out.push({ seq, title, responsible: cleanResponsible(item.speaker), ref: item.n_doc ?? '', depth })
    if (item.subitems?.length) out.push(...flattenAgenda(item.subitems, depth + 1))
  }
  return out
}

export function normalizeAgendaDate(raw: unknown): string {
  if (!raw) return ''
  const s = String(raw)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : s
}

export interface AgendaDrawer {
  key: string
  label: string
  date: string
  note?: string
  rows: FlatRow[]
}

export function agendaDrawers(agenda: RichMeeting['agenda'] | undefined): AgendaDrawer[] {
  const out: AgendaDrawer[] = []
  if (agenda?.opening_session) {
    const s: AgendaSession = agenda.opening_session
    out.push({ key: 'opening', label: 'Opening session', date: normalizeAgendaDate(s.date), note: s.note, rows: flattenAgenda(s.items) })
  }
  if (agenda?.closing_session) {
    const s: AgendaSession = agenda.closing_session
    out.push({ key: 'closing', label: 'Closing session', date: normalizeAgendaDate(s.date), note: s.note, rows: flattenAgenda(s.items) })
  }
  return out
}
