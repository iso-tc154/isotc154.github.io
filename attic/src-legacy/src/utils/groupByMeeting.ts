import { meetingSourceFromParts } from '../domain/meetingSource'
import { URN_BASE, meetingUrn, meetingDetailPath } from '../utils/urn'
import type { MeetingSummary } from '../types/resolution'

export type { MeetingSummary }

interface ResolutionLike {
  source_type: string
  source_file: string
  source_title?: string
  meeting_date?: string
  venue?: string
  year?: string
  is_acclamation?: boolean
}

export function groupResolutionsByMeeting<R extends ResolutionLike>(resolutions: R[]): MeetingSummary[] {
  const map = new Map<string, MeetingSummary>()

  for (const res of resolutions) {
    const key = `${res.source_type}/${res.source_file}`
    if (!map.has(key)) {
      const src = meetingSourceFromParts(res.source_type, res.source_file)
      const path = src ? meetingDetailPath(src) : `/resolutions/?meeting=${res.source_type}/${res.source_file}`
      const urn = src
        ? meetingUrn(src)
        : `${URN_BASE}:meeting:${res.source_type}/${res.source_file}`
      map.set(key, {
        source_type: res.source_type,
        source_file: res.source_file,
        source_title: res.source_title || '',
        meeting_date: res.meeting_date || '',
        venue: res.venue || '',
        year: res.year || '',
        resolution_count: 0,
        acclamation_count: 0,
        path,
        meeting_urn: urn,
      })
    }
    const m = map.get(key)!
    m.resolution_count++
    if (res.is_acclamation) m.acclamation_count++
  }

  const list = Array.from(map.values())
  list.sort((a, b) => (b.meeting_date || '').localeCompare(a.meeting_date || ''))
  return list
}
