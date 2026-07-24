import { ordinalText } from '../utils/ordinal.ts'

export type MeetingSourceKind = 'plenary' | 'ballots'

export interface MeetingSource {
  readonly kind: MeetingSourceKind
  readonly raw: string
  readonly ordinal: number | null
  readonly year: number | null
}

const PLENARY_RE = /^plenary-(\d+)(?:_[2-9])?$/
const BALLOTS_RE = /^ballots-(\d{4})$/

export function parseMeetingSource(raw: string): MeetingSource | null {
  if (!raw) return null
  let m = raw.match(PLENARY_RE)
  if (m) {
    const ordinal = parseInt(m[1], 10)
    return { kind: 'plenary', raw: `plenary-${ordinal}`, ordinal, year: null }
  }
  m = raw.match(BALLOTS_RE)
  if (m) {
    const year = parseInt(m[1], 10)
    return { kind: 'ballots', raw: `ballots-${year}`, ordinal: null, year }
  }
  return null
}

export function meetingSourceKind(sourceType: string, sourceFile: string): MeetingSourceKind | null {
  if (sourceType === 'plenary' && PLENARY_RE.test(sourceFile)) return 'plenary'
  if (sourceType === 'ballots' && BALLOTS_RE.test(sourceFile)) return 'ballots'
  return null
}

export function meetingSourceFromParts(sourceType: string, sourceFile: string): MeetingSource | null {
  const kind = meetingSourceKind(sourceType, sourceFile)
  if (!kind) return null
  return parseMeetingSource(sourceFile)
}

export function parseMeetingSourceParam(param: string | null | undefined): MeetingSource | null {
  if (!param) return null
  const parts = param.split('/')
  if (parts.length !== 2) return null
  const [sourceType, sourceFile] = parts
  if (!sourceType || !sourceFile) return null
  return meetingSourceFromParts(sourceType, sourceFile)
}

export function formatMeetingSource(s: MeetingSource): string {
  return s.raw
}

export function meetingSourceShortTitle(s: MeetingSource): string {
  if (s.kind === 'plenary' && s.ordinal !== null) return `${ordinalText(s.ordinal)} Plenary Meeting`
  if (s.kind === 'ballots' && s.year !== null) return `${s.year} Committee Ballots`
  return s.raw
}

export function meetingSourceOrdinal(s: MeetingSource): number | null {
  return s.ordinal
}
