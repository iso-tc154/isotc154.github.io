// The schedule calendar's build-time model: time parsing, event
// categorization, and lane layout. Pure — the component supplies
// data and renders the result.

export type ScheduleCategory = 'plenary' | 'wg' | 'jwg' | 'pt' | 'social' | 'deadline' | 'ma' | 'nwip' | 'opening' | 'other'

export interface ScheduleItem {
  date: string
  time?: string
  event?: string
  description?: string
}

export interface ProcessedEvent extends ScheduleItem {
  startMin: number
  endMin: number
  allDay: boolean
  tzNote?: string
  category: ScheduleCategory
  lane: number
  laneCount: number
  /** Plenary/opening events on a date with a session agenda open the drawer. */
  clickable: boolean
}

export interface ScheduleDay {
  date: string
  events: ProcessedEvent[]
  laneCount: number
}

export function normalizeScheduleDate(raw: unknown): string {
  if (!raw) return ''
  const s = String(raw)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : s
}

export function parseTime(raw?: string): { startMin: number; endMin: number; allDay: boolean; tzNote?: string } {
  if (!raw || !raw.trim()) return { startMin: 9 * 60, endMin: 17 * 60, allDay: true }
  const lower = raw.toLowerCase()
  if (lower.includes('all day') || lower === 'tbd' || lower === 'tba' || lower.includes('tbc')) {
    return { startMin: 9 * 60, endMin: 17 * 60, allDay: true }
  }
  let tzNote: string | undefined
  const tzParen = raw.match(/\(([^)]+)\)/)
  if (tzParen) tzNote = tzParen[1]
  else if (/utc\s*[+-]\s*\d+/i.test(raw)) tzNote = raw.match(/utc\s*[+-]\s*\d+/i)?.[0]
  const range = raw.match(/(\d{1,2}):(\d{2})\s*[–\-]\s*(\d{1,2}):(\d{2})/)
  if (range) {
    const startMin = parseInt(range[1]) * 60 + parseInt(range[2])
    let endMin = parseInt(range[3]) * 60 + parseInt(range[4])
    if (endMin <= startMin) endMin += 24 * 60
    return { startMin, endMin, allDay: false, tzNote }
  }
  const single = raw.match(/(\d{1,2}):(\d{2})/)
  if (single) {
    const startMin = parseInt(single[1]) * 60 + parseInt(single[2])
    return { startMin, endMin: startMin + 60, allDay: false, tzNote }
  }
  return { startMin: 9 * 60, endMin: 17 * 60, allDay: true, tzNote }
}

export function categorize(name?: string): ScheduleCategory {
  if (!name) return 'other'
  const lower = name.toLowerCase()
  if (lower.includes('opening')) return 'opening'
  if (lower.includes('plenary') || lower.includes('closing')) return 'plenary'
  if (lower.includes('social') || lower.includes('reception') || lower.includes('dinner')) return 'social'
  if (lower.match(/\bjwg\s*\d/)) return 'jwg'
  if (lower.match(/\bpt\s*\d/)) return 'pt'
  if (lower.match(/\bwg\s*\d/) || lower.includes('working group')) return 'wg'
  if (lower.includes('untbed') || lower.includes('tded') || lower.match(/\bjma\b/)) return 'ma'
  if (lower.match(/\bma\b/) && !lower.match(/\bmanager\b/)) return 'ma'
  if (lower.includes('nwip') || lower.includes('pwi')) return 'nwip'
  if (lower.includes('registration') || lower.includes('deadline')) return 'deadline'
  return 'other'
}

// Lay out one day: sort by start, assign each event the first lane whose
// last event ends before it starts.
function layoutDay(date: string, items: ScheduleItem[], agendaDates: string[]): ScheduleDay {
  const parsed: ProcessedEvent[] = items.map((item) => {
    const t = parseTime(item.time)
    const category = categorize(item.event)
    return {
      ...item,
      date,
      startMin: t.startMin,
      endMin: t.endMin,
      allDay: t.allDay,
      tzNote: t.tzNote,
      category,
      clickable: (category === 'plenary' || category === 'opening') && agendaDates.includes(date),
      lane: 0,
      laneCount: 1,
    }
  })
  parsed.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
  const laneEnds: number[] = []
  for (const ev of parsed) {
    let laneIdx = laneEnds.findIndex((end) => end <= ev.startMin)
    if (laneIdx === -1) {
      laneIdx = laneEnds.length
      laneEnds.push(ev.endMin)
    } else {
      laneEnds[laneIdx] = ev.endMin
    }
    ev.lane = laneIdx
  }
  const laneCount = Math.max(laneEnds.length, 1)
  for (const ev of parsed) ev.laneCount = laneCount
  return { date, events: parsed, laneCount }
}

export function buildScheduleDays(schedule: ScheduleItem[], agendaDates: string[] = []): ScheduleDay[] {
  const byDate = new Map<string, ScheduleItem[]>()
  for (const item of schedule) {
    const d = normalizeScheduleDate(item.date)
    if (!d) continue
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(item)
  }
  return [...byDate.entries()]
    .map(([date, items]) => layoutDay(date, items, agendaDates))
    .sort((a, b) => a.date.localeCompare(b.date))
}
