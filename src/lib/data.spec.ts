import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { loadData } from './data'

// The loaders read public/data/*.json, produced by scripts/build-data.mjs.
// These specs assert pipeline invariants: run `pnpm build-data` first.
const dataReady = () => existsSync('public/data/meetings.json') && existsSync('public/data/members.json')

describe.skipIf(!dataReady())('loadData pipeline invariants', () => {
  it('every meeting has an ordinal, url, and sessions array', () => {
    for (const m of loadData.meetings()) {
      expect(m.ordinal, `meeting ${m.id}`).toBeGreaterThan(0)
      expect(m.url).toMatch(/^\/meetings\//)
      expect(Array.isArray(m.sessions)).toBe(true)
    }
  })

  it('every member has a member-id matching the record and a name', () => {
    for (const [id, member] of Object.entries(loadData.members().all)) {
      expect(member['member-id'], `member ${id}`).toBe(id)
      expect(member.name.length).toBeGreaterThan(0)
    }
  })

  it('every standard has an id, url, and iso.name', () => {
    for (const s of loadData.standards()) {
      expect(s.url).toMatch(/^\/standards\//)
      expect(s.iso.name.length).toBeGreaterThan(0)
    }
  })

  it('posts are uniquely slugged', () => {
    const slugs = loadData.posts().map((p) => p.slug)
    expect(new Set(slugs).size).toBe(slugs.length)
  })

  it('history milestones carry a date and category', () => {
    for (const h of loadData.history()) {
      expect(h.date).toMatch(/^\d{4}/)
      expect(h.category.length).toBeGreaterThan(0)
    }
  })

  it('meetings.json: ordinals are contiguous and URLs are on the live platform', () => {
    const meetings = loadData.meetings()
    const ordinals = meetings.map((m) => m.ordinal).filter((n): n is number => n != null).sort((a, b) => a - b)
    expect(ordinals.length).toBeGreaterThan(40)
    for (let i = 1; i < ordinals.length; i++) {
      expect(ordinals[i] - ordinals[i - 1], `ordinal gap ${ordinals[i - 1]}→${ordinals[i]}`).toBe(1)
    }
    for (const m of meetings) {
      if (m.primary.iso_meeting_url) {
        expect(m.primary.iso_meeting_url, m.id).toMatch(/^https:\/\/sd\.iso\.org\/meetings\/\d+$/)
      }
      for (const s of m.sessions) {
        expect(s.start_date === undefined || /^\d{1,2} [A-Za-z]{3} \d{4}/.test(s.start_date), m.id).toBe(true)
      }
    }
  })

  it('meta exposes the footer stats and current-meeting pointers', () => {
    const meta = loadData.meta()
    expect(meta.counts.publishedStandards).toBeGreaterThan(0)
    expect(meta.current.nextPlenary?.url).toMatch(/^\/meetings\//)
  })
})
