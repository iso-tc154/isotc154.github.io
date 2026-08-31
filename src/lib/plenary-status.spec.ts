import { describe, it, expect } from 'vitest'
import { plenaryStatus, PLENARY_LEAD_DAYS } from './plenary-status'

// The 45th plenary: Mon 31 Aug – Fri 4 Sep 2026 (Berlin).
const FROM = '2026-08-31'
const TO = '2026-09-04'
const utc = (iso: string) => new Date(iso + 'Z')

describe('plenaryStatus', () => {
  it('reports the lead-in count and stays outside the banner window when far out', () => {
    const s = plenaryStatus(utc('2026-08-10T12:00:00'), FROM, TO)
    expect(s.phase).toBe('upcoming')
    expect(s.daysUntilStart).toBe(21)
    expect(s.line).toBe('begins in 21 days')
    expect(s.active).toBe(false)
  })

  it('enters the window on the lead day', () => {
    expect(PLENARY_LEAD_DAYS).toBe(3)
    const s = plenaryStatus(utc('2026-08-28T09:00:00'), FROM, TO)
    expect(s.active).toBe(true)
    expect(s.line).toBe('begins in 3 days')
  })

  it('says begins tomorrow on the eve', () => {
    const s = plenaryStatus(utc('2026-08-30T23:00:00'), FROM, TO)
    expect(s.phase).toBe('tomorrow')
    expect(s.line).toBe('begins tomorrow')
    expect(s.active).toBe(true)
  })

  it('flips to day 1 at UTC midnight, not local midnight', () => {
    expect(plenaryStatus(utc('2026-08-30T23:59:59'), FROM, TO).phase).toBe('tomorrow')
    const s = plenaryStatus(utc('2026-08-31T00:00:01'), FROM, TO)
    expect(s.phase).toBe('underway')
    expect(s.day).toBe(1)
    expect(s.line).toBe('underway now — day 1 of 5')
  })

  it('counts days mid-week', () => {
    const s = plenaryStatus(utc('2026-09-02T18:30:00'), FROM, TO)
    expect(s.day).toBe(3)
    expect(s.line).toBe('underway now — day 3 of 5')
  })

  it('announces the final day', () => {
    const s = plenaryStatus(utc('2026-09-04T08:00:00'), FROM, TO)
    expect(s.phase).toBe('final-day')
    expect(s.line).toBe('underway now — day 5 of 5 · concludes today')
    expect(s.active).toBe(true)
  })

  it('ends after the last UTC day', () => {
    const s = plenaryStatus(utc('2026-09-05T00:00:01'), FROM, TO)
    expect(s.phase).toBe('ended')
    expect(s.active).toBe(false)
    expect(s.line).toBe('')
  })

  it('handles a single-day meeting', () => {
    const before = plenaryStatus(utc('2026-05-01T10:00:00'), '2026-05-02', '2026-05-02')
    expect(before.line).toBe('begins tomorrow')
    const during = plenaryStatus(utc('2026-05-02T10:00:00'), '2026-05-02', '2026-05-02')
    expect(during.phase).toBe('final-day')
    expect(during.line).toBe('underway now — concludes today')
    const after = plenaryStatus(utc('2026-05-03T10:00:00'), '2026-05-02', '2026-05-02')
    expect(after.phase).toBe('ended')
  })

  it('handles meetings with no end date (single day)', () => {
    const s = plenaryStatus(utc('2026-05-02T10:00:00'), '2026-05-02', null)
    expect(s.length).toBe(1)
    expect(s.line).toBe('underway now — concludes today')
  })

  it('is inactive without dates', () => {
    expect(plenaryStatus(new Date()).active).toBe(false)
    expect(plenaryStatus(new Date(), 'not-a-date', 'nope').line).toBe('')
  })

  it('crosses month and year boundaries correctly', () => {
    const s = plenaryStatus(utc('2026-12-28T12:00:00'), '2026-12-30', '2027-01-03')
    expect(s.daysUntilStart).toBe(2)
    expect(s.length).toBe(5)
    const mid = plenaryStatus(utc('2027-01-01T12:00:00'), '2026-12-30', '2027-01-03')
    expect(mid.day).toBe(3)
  })

  it('treats an end before the start as single-day', () => {
    const s = plenaryStatus(utc('2026-05-02T10:00:00'), '2026-05-02', '2026-05-01')
    expect(s.length).toBe(1)
    expect(s.line).toBe('underway now — concludes today')
  })
})
