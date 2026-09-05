import { describe, it, expect } from 'vitest'
import {
  normalizeScheduleDate, parseTime, categorize, buildScheduleDays,
} from './schedule'

describe('normalizeScheduleDate', () => {
  it('keeps the date part and passes through garbage', () => {
    expect(normalizeScheduleDate('2026-09-02T09:00:00Z')).toBe('2026-09-02')
    expect(normalizeScheduleDate('2026-09-02')).toBe('2026-09-02')
    expect(normalizeScheduleDate('TBA')).toBe('TBA')
    expect(normalizeScheduleDate(undefined)).toBe('')
  })
})

describe('parseTime', () => {
  it('defaults to a 9-17 all-day window', () => {
    expect(parseTime()).toEqual({ startMin: 540, endMin: 1020, allDay: true })
    expect(parseTime('All day')).toEqual({ startMin: 540, endMin: 1020, allDay: true })
    expect(parseTime('TBD')).toMatchObject({ allDay: true })
  })
  it('parses HH:MM–HH:MM ranges with en/em dashes and captures tz notes', () => {
    expect(parseTime('9:00–10:30 (CEST)')).toEqual({ startMin: 540, endMin: 630, allDay: false, tzNote: 'CEST' })
    expect(parseTime('14:00-15:30 UTC+2')).toEqual({ startMin: 840, endMin: 930, allDay: false, tzNote: 'UTC+2' })
  })
  it('wraps past-midnight ends to the next day', () => {
    expect(parseTime('22:00–01:00')).toEqual({ startMin: 1320, endMin: 1500, allDay: false, tzNote: undefined })
  })
  it('single times get a one-hour slot', () => {
    expect(parseTime('11:00')).toEqual({ startMin: 660, endMin: 720, allDay: false, tzNote: undefined })
  })
})

describe('categorize', () => {
  it('maps meeting names to calendar categories', () => {
    expect(categorize('Opening session')).toBe('opening')
    expect(categorize('Closing plenary')).toBe('plenary')
    expect(categorize('WG 5 — Date and time')).toBe('wg')
    expect(categorize('JWG 9 UNTDED work')).toBe('jwg')
    expect(categorize('Social programme / dinner')).toBe('social')
    expect(categorize('Registration deadline')).toBe('deadline')
    expect(categorize('NWIP review')).toBe('nwip')
    expect(categorize(undefined)).toBe('other')
  })
  it('distinguishes maintenance-agency work from managers', () => {
    expect(categorize('ISO 7372 JMA meeting')).toBe('ma')
    expect(categorize('Committee manager briefing')).toBe('other')
  })
})

describe('buildScheduleDays', () => {
  const schedule = [
    { date: '2026-09-02', time: '9:00–10:30', event: 'WG 7 day session' },
    { date: '2026-09-02', time: '11:00–12:00', event: 'JWG 9' },
    { date: '2026-09-02', time: '9:30–11:30', event: 'Plenary session' },
    { date: '2026-09-03', event: 'Zoo tour (social)' },
  ]
  it('groups by date, sorts events, and assigns non-overlapping lanes', () => {
    const days = buildScheduleDays(schedule)
    expect(days.map((d) => d.date)).toEqual(['2026-09-02', '2026-09-03'])
    const d2 = days[0]
    expect(d2.events.map((e) => e.event)).toEqual([
      'WG 7 day session', 'Plenary session', 'JWG 9',
    ])
    // WG7 (540-630) takes lane 0. The plenary (570-690) overlaps WG7 →
    // lane 1. JWG9 (660-720) fits lane 0 (free after 630).
    expect(d2.events[0].lane).toBe(0)
    expect(d2.events[1].lane).toBe(1)
    expect(d2.events[2].lane).toBe(0)
    expect(d2.laneCount).toBe(2)
    expect(days[1].laneCount).toBe(1)
  })
  it('marks plenary/opening events on agenda dates clickable', () => {
    const days = buildScheduleDays(schedule, ['2026-09-02'])
    const plenary = days[0].events.find((e) => e.category === 'plenary')!
    const wg = days[0].events.find((e) => e.category === 'wg')!
    expect(plenary.clickable).toBe(true)
    expect(wg.clickable).toBe(false)
    // without agenda dates nothing is clickable
    expect(buildScheduleDays(schedule)[0].events.find((e) => e.category === 'plenary')!.clickable).toBe(false)
  })
  it('ignores empty dates', () => {
    expect(buildScheduleDays([{ date: undefined as unknown as string }])).toEqual([])
  })
})
