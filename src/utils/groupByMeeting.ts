import { meetingPath, buildMeetingUrn } from './urn'

export interface MeetingSummary {
  source_type: string
  source_file: string
  source_title: string
  meeting_date: string
  venue: string
  year: string
  resolution_count: number
  acclamation_count: number
  path: string
  meeting_urn: string
}

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
      map.set(key, {
        source_type: res.source_type,
        source_file: res.source_file,
        source_title: res.source_title || '',
        meeting_date: res.meeting_date || '',
        venue: res.venue || '',
        year: res.year || '',
        resolution_count: 0,
        acclamation_count: 0,
        path: meetingPath(res.source_type, res.source_file),
        meeting_urn: buildMeetingUrn(res.source_type, res.source_file),
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
