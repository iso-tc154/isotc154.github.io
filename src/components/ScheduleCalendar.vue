<script setup lang="ts">
import { computed } from 'vue'
import type { EventScheduleItem } from '../types/event'

type EventCategory =
  | 'plenary'
  | 'wg'
  | 'jwg'
  | 'pt'
  | 'social'
  | 'deadline'
  | 'ma'
  | 'nwip'
  | 'opening'
  | 'other'

interface ProcessedEvent extends EventScheduleItem {
  startMin: number
  endMin: number
  allDay: boolean
  tzNote?: string
  lane: number
  laneCount: number
  category: EventCategory
}

interface DayGroup {
  date: string
  events: ProcessedEvent[]
  laneCount: number
}

const props = defineProps<{
  schedule: EventScheduleItem[]
  venueName?: string
  generalArea?: string
}>()

const HOUR_HEIGHT = 56

const CATEGORY_META: Record<EventCategory, { label: string; bar: string; bg: string; bgDark: string; text: string; textDark: string }> = {
  plenary:  { label: 'Plenary',          bar: '#b91c1c', bg: '#fef2f3', bgDark: '#3b0a10', text: '#7a0008', textDark: '#ffb8be' },
  wg:       { label: 'Working Group',    bar: '#1e3a8a', bg: '#eef6fd', bgDark: '#0c2438', text: '#003c6a', textDark: '#9ec9ed' },
  jwg:      { label: 'Joint WG',         bar: '#0d9488', bg: '#effbf7', bgDark: '#0a2e2a', text: '#0a5e57', textDark: '#8fd6c9' },
  pt:       { label: 'Project Team',     bar: '#6366f1', bg: '#f0f1fe', bgDark: '#1b1e4a', text: '#3c3f9e', textDark: '#bcbfed' },
  social:   { label: 'Social',           bar: '#f59e0b', bg: '#fef6e7', bgDark: '#3b2a08', text: '#92590a', textDark: '#fbd583' },
  deadline: { label: 'Deadline',         bar: '#78716c', bg: '#f5f5f4', bgDark: '#292524', text: '#44403c', textDark: '#d6d3d1' },
  ma:       { label: 'Maintenance Agency', bar: '#16a34a', bg: '#edfdf2', bgDark: '#0c3a1c', text: '#0c6b2b', textDark: '#8fe6af' },
  nwip:     { label: 'NWIP / PWI',       bar: '#db2777', bg: '#fdf0f6', bgDark: '#3b0e25', text: '#9d1a58', textDark: '#fbb1d0' },
  opening:  { label: 'Opening',          bar: '#b91c1c', bg: '#fef2f3', bgDark: '#3b0a10', text: '#7a0008', textDark: '#ffb8be' },
  other:    { label: 'Other',            bar: '#57534e', bg: '#fafaf9', bgDark: '#292524', text: '#44403c', textDark: '#d6d3d1' },
}

function normalizeDate(raw: unknown): string {
  if (!raw) return ''
  const s = String(raw)
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (m) return `${m[1]}-${m[2]}-${m[3]}`
  return s
}

function parseTime(raw?: string): { startMin: number; endMin: number; allDay: boolean; tzNote?: string } {
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
    const [, sh, sm, eh, em] = range
    const startMin = parseInt(sh) * 60 + parseInt(sm)
    let endMin = parseInt(eh) * 60 + parseInt(em)
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

function categorize(name?: string): EventCategory {
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

const days = computed<DayGroup[]>(() => {
  const byDate = new Map<string, EventScheduleItem[]>()
  for (const item of props.schedule) {
    const d = normalizeDate(item.date)
    if (!d) continue
    if (!byDate.has(d)) byDate.set(d, [])
    byDate.get(d)!.push(item)
  }
  const result: DayGroup[] = []
  for (const [date, items] of byDate) {
    const parsed: ProcessedEvent[] = items.map(item => {
      const t = parseTime(item.time)
      return {
        ...item,
        date,
        startMin: t.startMin,
        endMin: t.endMin,
        allDay: t.allDay,
        tzNote: t.tzNote,
        category: categorize(item.event),
        lane: 0,
        laneCount: 1,
      }
    })
    parsed.sort((a, b) => a.startMin - b.startMin || a.endMin - b.endMin)
    const laneEnds: number[] = []
    for (const ev of parsed) {
      let laneIdx = laneEnds.findIndex(end => end <= ev.startMin)
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
    result.push({ date, events: parsed, laneCount })
  }
  result.sort((a, b) => a.date.localeCompare(b.date))
  return result
})

const legendCategories = computed(() => {
  const set = new Set<EventCategory>()
  for (const day of days.value) for (const ev of day.events) set.add(ev.category)
  return Array.from(set)
})

const gridBounds = computed(() => {
  let minMin: number | null = null
  let maxMin: number | null = null
  for (const day of days.value) {
    for (const ev of day.events) {
      if (ev.startMin < (minMin ?? Infinity)) minMin = ev.startMin
      if (ev.endMin > (maxMin ?? -Infinity)) maxMin = ev.endMin
    }
  }
  if (minMin == null || maxMin == null) {
    minMin = 9 * 60
    maxMin = 17 * 60
  }
  const startHour = Math.floor(minMin / 60)
  const endHour = maxMin % 60 === 0 ? maxMin / 60 : Math.ceil(maxMin / 60)
  const safeStart = Math.min(startHour, 23)
  const safeEnd = Math.max(endHour, safeStart + 1)
  return { startHour: safeStart, endHour: safeEnd }
})

const gridHeightPx = computed(() => (gridBounds.value.endHour - gridBounds.value.startHour) * HOUR_HEIGHT)

const gridHours = computed(() => {
  const hours: number[] = []
  for (let h = gridBounds.value.startHour; h <= gridBounds.value.endHour; h++) hours.push(h)
  return hours
})

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function dayLabel(rawDate: string): { weekday: string; date: string } {
  const norm = normalizeDate(rawDate)
  if (!norm) return { weekday: '', date: '' }
  const d = new Date(norm + 'T00:00:00')
  if (isNaN(d.getTime())) return { weekday: '', date: norm }
  return {
    weekday: dayNames[d.getDay()],
    date: `${monthNames[d.getMonth()]} ${d.getDate()}`,
  }
}

function formatTime(min: number): string {
  const h = Math.floor(min / 60) % 24
  const m = min % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function formatDuration(min: number): string {
  const h = Math.floor(min / 60)
  const m = min % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h${m}m`
}

function eventStyle(ev: ProcessedEvent): Record<string, string> {
  const startMin = gridBounds.value.startHour * 60
  const top = ((ev.startMin - startMin) / 60) * HOUR_HEIGHT
  const height = Math.max(((ev.endMin - ev.startMin) / 60) * HOUR_HEIGHT - 4, 32)
  const widthPct = 100 / ev.laneCount
  const leftPct = ev.lane * widthPct
  return {
    top: `${top}px`,
    height: `${height}px`,
    left: `calc(${leftPct}% + 2px)`,
    width: `calc(${widthPct}% - 4px)`,
  }
}

function hourLineTop(hour: number): string {
  return `${(hour - gridBounds.value.startHour) * HOUR_HEIGHT}px`
}

function timeLabelTop(hour: number): string {
  return `${(hour - gridBounds.value.startHour) * HOUR_HEIGHT}px`
}

function metaFor(category: EventCategory) {
  return CATEGORY_META[category]
}

function shouldShowAsCalendar(): boolean {
  const total = days.value.reduce((acc, d) => acc + d.events.length, 0)
  return total >= 2
}
</script>

<template>
  <div v-if="!shouldShowAsCalendar()" class="mini-schedule">
    <div v-for="day in days" :key="day.date" class="mini-day">
      <p class="mini-day__label">
        <span class="mini-day__weekday">{{ dayLabel(day.date).weekday }}</span>
        <span class="mini-day__date">{{ dayLabel(day.date).date }}</span>
      </p>
      <div class="mini-day__events">
        <div
          v-for="(ev, idx) in day.events"
          :key="idx"
          class="mini-event"
          :style="{ '--bar': metaFor(ev.category).bar }"
        >
          <p v-if="ev.time" class="mini-event__time">{{ ev.time }}</p>
          <p v-if="ev.event" class="mini-event__name">{{ ev.event }}</p>
          <p v-if="ev.description" class="mini-event__desc">{{ ev.description }}</p>
        </div>
      </div>
    </div>
  </div>

  <div v-else class="cal">
    <div v-if="venueName || generalArea" class="cal__context">
      <span v-if="venueName" class="cal__venue">{{ venueName }}</span>
      <span v-if="venueName && generalArea" class="cal__sep">·</span>
      <span v-if="generalArea" class="cal__area">{{ generalArea }}</span>
    </div>

    <div class="cal__legend">
      <span
        v-for="cat in legendCategories"
        :key="cat"
        class="cal__legend-item"
        :style="{ '--bar': metaFor(cat).bar }"
      >
        {{ metaFor(cat).label }}
      </span>
    </div>

    <div class="cal__desktop" aria-hidden="false">
      <div class="cal__grid">
        <div class="cal__time-axis">
          <div
            v-for="h in gridHours"
            :key="h"
            class="cal__time-tick"
            :style="{ top: timeLabelTop(h) }"
          >
            <span v-if="h < gridBounds.endHour" class="cal__time-label">{{ String(h).padStart(2, '0') }}:00</span>
          </div>
        </div>

        <div class="cal__days">
          <div v-for="day in days" :key="day.date" class="cal__day">
            <div class="cal__day-header">
              <span class="cal__day-weekday">{{ dayLabel(day.date).weekday }}</span>
              <span class="cal__day-date">{{ dayLabel(day.date).date }}</span>
            </div>
            <div class="cal__day-body" :style="{ height: `${gridHeightPx}px` }">
              <div
                v-for="h in gridHours.slice(0, -1)"
                :key="h"
                class="cal__hour-line"
                :style="{ top: hourLineTop(h + 1) }"
              />
              <div
                v-for="(ev, idx) in day.events"
                :key="idx"
                class="cal__event"
                :class="[`cal__event--${ev.category}`, { 'cal__event--all-day': ev.allDay }]"
                :style="{ ...eventStyle(ev), '--bar': metaFor(ev.category).bar, '--bg': metaFor(ev.category).bg, '--bg-dark': metaFor(ev.category).bgDark, '--text': metaFor(ev.category).text, '--text-dark': metaFor(ev.category).textDark }"
              >
                <p class="cal__event-time">
                  {{ formatTime(ev.startMin) }}–{{ formatTime(ev.endMin) }}
                  <span class="cal__event-dur">{{ formatDuration(ev.endMin - ev.startMin) }}</span>
                </p>
                <p v-if="ev.event" class="cal__event-name">{{ ev.event }}</p>
                <p v-if="ev.description" class="cal__event-desc">{{ ev.description }}</p>
                <p v-if="ev.tzNote" class="cal__event-tz">{{ ev.tzNote }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="cal__mobile">
      <div v-for="day in days" :key="day.date" class="cal__mobile-day">
        <div class="cal__mobile-header">
          <span class="cal__mobile-weekday">{{ dayLabel(day.date).weekday }}</span>
          <span class="cal__mobile-date">{{ dayLabel(day.date).date }}</span>
        </div>
        <div class="cal__mobile-events">
          <div
            v-for="(ev, idx) in day.events"
            :key="idx"
            class="cal__mobile-event"
            :class="[`cal__event--${ev.category}`]"
            :style="{ '--bar': metaFor(ev.category).bar, '--bg': metaFor(ev.category).bg, '--bg-dark': metaFor(ev.category).bgDark, '--text': metaFor(ev.category).text, '--text-dark': metaFor(ev.category).textDark }"
          >
            <div class="cal__mobile-time">
              <span class="cal__mobile-clock">{{ formatTime(ev.startMin) }}–{{ formatTime(ev.endMin) }}</span>
              <span v-if="ev.tzNote" class="cal__mobile-tz">{{ ev.tzNote }}</span>
            </div>
            <div class="cal__mobile-body">
              <p v-if="ev.event" class="cal__mobile-name">{{ ev.event }}</p>
              <p v-if="ev.description" class="cal__mobile-desc">{{ ev.description }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.cal {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.cal__context {
  font-size: 0.875rem;
  color: #78716c;
  font-family: ui-monospace, monospace;
}
.dark .cal__context { color: #a8a29e; }
.cal__venue { color: var(--color-brand); font-weight: 600; }
.cal__sep { margin: 0 0.5rem; opacity: 0.5; }

.cal__legend {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem 0.875rem;
  font-size: 0.75rem;
  color: #57534e;
  padding-bottom: 0.75rem;
  border-bottom: 1px dashed #e7e5e4;
}
.dark .cal__legend { color: #d6d3d1; border-bottom-color: #292524; }
.cal__legend-item {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
}
.cal__legend-item::before {
  content: '';
  width: 0.625rem; height: 0.625rem;
  border-radius: 0.125rem;
  background: var(--bar);
  display: inline-block;
}

.cal__desktop { display: block; }
.cal__mobile { display: none; }

.cal__grid {
  display: grid;
  grid-template-columns: 3.5rem 1fr;
  gap: 0;
  background: #ffffff;
  border: 1px solid #e7e5e4;
  border-radius: 0.625rem;
  overflow: hidden;
}
.dark .cal__grid { background: #1c1917; border-color: #292524; }

.cal__time-axis {
  position: relative;
  border-right: 1px solid #e7e5e4;
  background: #fafaf9;
}
.dark .cal__time-axis { background: #292524; border-right-color: #44403c; }

.cal__time-tick {
  position: absolute;
  left: 0; right: 0;
  height: 0;
}
.cal__time-label {
  position: absolute;
  top: -0.5rem;
  right: 0.5rem;
  font-family: ui-monospace, monospace;
  font-size: 0.6875rem;
  color: #a8a29e;
  letter-spacing: 0.02em;
}
.dark .cal__time-label { color: #78716c; }

.cal__days {
  display: grid;
  grid-auto-columns: minmax(0, 1fr);
  grid-auto-flow: column;
}

.cal__day {
  border-right: 1px solid #e7e5e4;
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.cal__day:last-child { border-right: none; }
.dark .cal__day { border-right-color: #292524; }

.cal__day-header {
  padding: 0.625rem 0.75rem;
  background: #fafaf9;
  border-bottom: 1px solid #e7e5e4;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.125rem;
}
.dark .cal__day-header { background: #292524; border-bottom-color: #44403c; }
.cal__day-weekday {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-brand);
}
.cal__day-date {
  font-family: var(--font-serif);
  font-size: 0.9375rem;
  font-weight: 600;
  color: #1c1917;
  letter-spacing: -0.01em;
}
.dark .cal__day-date { color: #fafaf9; }

.cal__day-body {
  position: relative;
  overflow: hidden;
}

.cal__hour-line {
  position: absolute;
  left: 0; right: 0;
  height: 0;
  border-top: 1px dashed #e7e5e4;
  pointer-events: none;
}
.dark .cal__hour-line { border-top-color: #292524; }

.cal__event {
  position: absolute;
  background: var(--bg);
  border-left: 3px solid var(--bar);
  border-radius: 0.375rem;
  padding: 0.375rem 0.5rem;
  overflow: hidden;
  cursor: default;
  color: var(--text);
  transition: transform 120ms ease, box-shadow 120ms ease;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
}
.cal__event:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(15, 23, 42, 0.08);
  z-index: 2;
}
.dark .cal__event { background: var(--bg-dark); color: var(--text-dark); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.4); }
.dark .cal__event:hover { box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5); }

.cal__event-time {
  font-family: ui-monospace, monospace;
  font-size: 0.6875rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: baseline;
  gap: 0.375rem;
  color: var(--text);
  opacity: 0.85;
}
.dark .cal__event-time { color: var(--text-dark); }
.cal__event-dur {
  font-size: 0.625rem;
  font-weight: 400;
  opacity: 0.7;
}
.cal__event-name {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 0.8125rem;
  line-height: 1.25;
  margin: 0.125rem 0 0;
  letter-spacing: -0.01em;
}
.cal__event-desc {
  font-size: 0.6875rem;
  line-height: 1.35;
  margin: 0.1875rem 0 0;
  opacity: 0.78;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.cal__event-tz {
  font-size: 0.625rem;
  margin: 0.125rem 0 0;
  font-family: ui-monospace, monospace;
  opacity: 0.65;
}

.cal__event--plenary { border-left-width: 4px; }
.cal__event--social { border-left-style: dotted; border-left-width: 4px; }
.cal__event--deadline { border-left-style: dashed; }

.cal__mobile { display: none; }

.mini-schedule {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.mini-day {
  background: #fafaf9;
  border-radius: 0.5rem;
  padding: 0.875rem 1rem;
  border-left: 3px solid var(--color-brand);
}
.dark .mini-day { background: #292524; }
.mini-day__label {
  display: flex;
  align-items: baseline;
  gap: 0.625rem;
  margin: 0 0 0.5rem;
}
.mini-day__weekday {
  font-size: 0.6875rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--color-brand);
}
.mini-day__date {
  font-family: var(--font-serif);
  font-weight: 600;
  font-size: 0.9375rem;
  color: #1c1917;
}
.dark .mini-day__date { color: #fafaf9; }
.mini-day__events { display: flex; flex-direction: column; gap: 0.5rem; }
.mini-event {
  padding: 0.5rem 0.75rem;
  background: #ffffff;
  border-radius: 0.375rem;
  border-left: 3px solid var(--bar, #57534e);
}
.dark .mini-event { background: #1c1917; }
.mini-event__time {
  font-family: ui-monospace, monospace;
  font-size: 0.75rem;
  color: #78716c;
  margin: 0 0 0.125rem;
}
.dark .mini-event__time { color: #a8a29e; }
.mini-event__name {
  font-weight: 600;
  margin: 0;
  font-family: var(--font-serif);
  color: #1c1917;
}
.dark .mini-event__name { color: #fafaf9; }
.mini-event__desc {
  font-size: 0.8125rem;
  color: #57534e;
  margin: 0.125rem 0 0;
}
.dark .mini-event__desc { color: #d6d3d1; }

@media (max-width: 880px) {
  .cal__desktop { display: none; }
  .cal__mobile { display: flex; flex-direction: column; gap: 0.875rem; }

  .cal__mobile-day {
    background: #ffffff;
    border: 1px solid #e7e5e4;
    border-radius: 0.5rem;
    overflow: hidden;
  }
  .dark .cal__mobile-day { background: #1c1917; border-color: #292524; }

  .cal__mobile-header {
    padding: 0.625rem 0.875rem;
    background: #fafaf9;
    border-bottom: 1px solid #e7e5e4;
    display: flex;
    align-items: baseline;
    gap: 0.625rem;
  }
  .dark .cal__mobile-header { background: #292524; border-bottom-color: #44403c; }
  .cal__mobile-weekday {
    font-size: 0.6875rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.12em;
    color: var(--color-brand);
  }
  .cal__mobile-date {
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: 0.9375rem;
    color: #1c1917;
  }
  .dark .cal__mobile-date { color: #fafaf9; }

  .cal__mobile-events { display: flex; flex-direction: column; }
  .cal__mobile-event {
    display: grid;
    grid-template-columns: 5rem 1fr;
    gap: 0.625rem;
    padding: 0.625rem 0.75rem;
    border-bottom: 1px solid #e7e5e4;
    background: var(--bg);
    border-left: 3px solid var(--bar);
  }
  .cal__mobile-event:last-child { border-bottom: none; }
  .dark .cal__mobile-event { background: var(--bg-dark); border-bottom-color: #292524; }

  .cal__mobile-time { display: flex; flex-direction: column; gap: 0.125rem; }
  .cal__mobile-clock {
    font-family: ui-monospace, monospace;
    font-size: 0.75rem;
    font-weight: 600;
    color: var(--text);
  }
  .dark .cal__mobile-clock { color: var(--text-dark); }
  .cal__mobile-tz {
    font-family: ui-monospace, monospace;
    font-size: 0.625rem;
    color: var(--text);
    opacity: 0.7;
  }
  .dark .cal__mobile-tz { color: var(--text-dark); }

  .cal__mobile-body { min-width: 0; }
  .cal__mobile-name {
    font-family: var(--font-serif);
    font-weight: 600;
    font-size: 0.875rem;
    line-height: 1.25;
    margin: 0;
    color: var(--text);
  }
  .dark .cal__mobile-name { color: var(--text-dark); }
  .cal__mobile-desc {
    font-size: 0.75rem;
    line-height: 1.4;
    margin: 0.125rem 0 0;
    color: var(--text);
    opacity: 0.78;
  }
  .dark .cal__mobile-desc { color: var(--text-dark); }
}
</style>
