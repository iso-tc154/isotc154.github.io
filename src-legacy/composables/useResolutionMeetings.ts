import { computed, type ComputedRef } from 'vue'
import { useResolutions } from './useResolutions'
import { groupResolutionsByMeeting } from '../utils/groupByMeeting'
import type { MeetingSummary } from '../types/resolution'

export type { MeetingSummary }

export interface DecadeGroup {
  label: string
  resCount: number
  accCount: number
  meetings: MeetingSummary[]
}

export function groupMeetingsByDecade(meetings: MeetingSummary[]): DecadeGroup[] {
  const decades: Record<string, { meetings: MeetingSummary[]; resCount: number; accCount: number }> = {}

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

/**
 * Resolution-derived meeting index.
 *
 * Each "meeting" here is the set of resolutions that share a source
 * (e.g. plenary-44, ballots-2023). This is *not* the canonical plenary list —
 * see `useMeetings` for that.
 */
export function useResolutionMeetings() {
  const { resolutions, isLoaded, loadData } = useResolutions()

  const meetings: ComputedRef<MeetingSummary[]> = computed(() =>
    groupResolutionsByMeeting(resolutions.value),
  )

  const getMeeting = (sourceType: string, sourceFile: string): MeetingSummary | undefined => {
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
