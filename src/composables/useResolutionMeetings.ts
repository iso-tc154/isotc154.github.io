import { computed, type ComputedRef } from 'vue'
import { useResolutions } from './useResolutions'
import { meetingPath } from '../utils/urn'
import type { Meeting } from '../types/resolution'

export type { Meeting }

export interface DecadeGroup {
  label: string
  resCount: number
  accCount: number
  meetings: Meeting[]
}

export function groupMeetingsByDecade(meetings: Meeting[]): DecadeGroup[] {
  const decades: Record<string, { meetings: Meeting[]; resCount: number; accCount: number }> = {}

  meetings.forEach(m => {
    const year = parseInt(m.year)
    if (isNaN(year)) return
    const decade = Math.floor(year / 10) * 10 + 's'
    if (!decades[decade]) {
      decades[decade] = { meetings: [], resCount: 0, accCount: 0 }
    }
    decades[decade].meetings.push(m)
    decades[decade].resCount += (m.resolution_count || 0)
    decades[decade].accCount += (m.acclamation_count || 0)
  })

  return Object.keys(decades)
    .sort((a, b) => b.localeCompare(a))
    .map(key => ({
      label: key,
      resCount: decades[key].resCount,
      accCount: decades[key].accCount,
      meetings: decades[key].meetings.sort((a, b) => b.year.localeCompare(a.year))
    }))
}

function meetingKey(m: { source_type: string; source_file: string }): string {
  return `${m.source_type}/${m.source_file}`
}

/**
 * Resolution-derived meeting index.
 *
 * Each "meeting" here is the set of resolutions that share a source
 * (e.g. plenary-44, ballots-2023). This is *not* the canonical plenary list —
 * see `useMeetings` for that.
 */
export function useResolutionMeetings() {
  const { resolutions, isLoaded, loadData } = useResolutions()

  const meetings: ComputedRef<Meeting[]> = computed(() => {
    if (!resolutions.value.length) return []

    const map = new Map<string, Meeting>()

    resolutions.value.forEach(res => {
      const key = meetingKey(res)
      if (!map.has(key)) {
        map.set(key, {
          source_type: res.source_type,
          source_file: res.source_file,
          source_title: res.source_title || 'Unknown Meeting',
          meeting_date: res.meeting_date,
          venue: res.venue,
          year: res.year,
          resolution_count: 0,
          acclamation_count: 0,
          path: meetingPath(res.source_type, res.source_file),
          meeting_urn: res.meeting_urn,
        })
      }
      const m = map.get(key)!
      m.resolution_count++
      if (res.is_acclamation) {
        m.acclamation_count++
      }
    })

    const list = Array.from(map.values())
    list.sort((a, b) => {
      if (a.meeting_date === b.meeting_date) return 0
      return a.meeting_date > b.meeting_date ? -1 : 1
    })

    return list
  })

  const getMeeting = (sourceType: string, sourceFile: string): Meeting | undefined => {
    return meetings.value.find(m => m.source_type === sourceType && m.source_file === sourceFile)
  }

  const getMeetingResolutions = (sourceType: string, sourceFile: string) => {
    return resolutions.value.filter(r => r.source_type === sourceType && r.source_file === sourceFile)
  }

  return {
    isLoaded,
    loadData,
    meetings,
    getMeeting,
    getMeetingResolutions,
  }
}
