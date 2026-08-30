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

  it('meta exposes the footer stats and current-meeting pointers', () => {
    const meta = loadData.meta()
    expect(meta.counts.publishedStandards).toBeGreaterThan(0)
    expect(meta.current.nextPlenary?.url).toMatch(/^\/meetings\//)
  })
})
