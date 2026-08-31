// Plenary banner state machine — the single source of truth used by both
// the build-time fallback (NextPlenaryBanner.astro frontmatter) and the
// runtime script that keeps the banner correct between rebuilds.
//
// All arithmetic is UTC calendar days: the phase flips at UTC midnight
// regardless of the viewer's or the build machine's timezone, and the
// meeting dates are treated as UTC dates.

export const PLENARY_LEAD_DAYS = 3

const DAY_MS = 86_400_000

export type PlenaryPhase = 'upcoming' | 'tomorrow' | 'underway' | 'final-day' | 'ended'

export interface PlenaryStatus {
  phase: PlenaryPhase
  /** Banner window: from LEAD_DAYS before the start through the last day. */
  active: boolean
  /** Days (UTC) from today to the start; negative once underway. */
  daysUntilStart: number
  /** 1-based day of the meeting while it runs; 0 otherwise. */
  day: number
  /** Total meeting days; 0 when dates are missing. */
  length: number
  /** Rendered status line; empty when ended or undatable. */
  line: string
}

const utcMidnight = (d: Date) => Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())

const parseDay = (s?: string | null): number | null => {
  if (!s) return null
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : null
}

export function plenaryStatus(now: Date, from?: string | null, to?: string | null): PlenaryStatus {
  const start = parseDay(from)
  const parsedEnd = parseDay(to)
  if (start == null) {
    return { phase: 'ended', active: false, daysUntilStart: NaN, day: 0, length: 0, line: '' }
  }
  const end = parsedEnd != null && parsedEnd >= start ? parsedEnd : start

  const today = utcMidnight(now)
  const daysUntilStart = Math.round((start - today) / DAY_MS)
  const length = Math.round((end - start) / DAY_MS) + 1
  const day = Math.round((today - start) / DAY_MS) + 1

  let phase: PlenaryPhase
  if (daysUntilStart > 1) phase = 'upcoming'
  else if (daysUntilStart === 1) phase = 'tomorrow'
  else if (day >= 1 && day < length) phase = 'underway'
  else if (day === length) phase = 'final-day'
  else phase = 'ended'

  let line = ''
  if (phase === 'upcoming') line = `begins in ${daysUntilStart} days`
  else if (phase === 'tomorrow') line = 'begins tomorrow'
  else if (phase === 'underway') line = `underway now — day ${day} of ${length}`
  else if (phase === 'final-day') {
    line = length === 1
      ? 'underway now — concludes today'
      : `underway now — day ${length} of ${length} · concludes today`
  }

  return {
    phase,
    active: phase !== 'ended' && daysUntilStart <= PLENARY_LEAD_DAYS,
    daysUntilStart,
    day: phase === 'underway' || phase === 'final-day' ? day : 0,
    length,
    line,
  }
}
