// Conventions of _data/members/*.yaml, pinned after real incidents:
// - roles[].{from,to}.date must be full YYYY-MM-DD (a year-only '2026'
//   passed the display layer and failed CI's Ruby validator — Drexler);
// - year-only knowledge is encoded YYYY-01-01 + precision: year;
// - deceased members close every role (open roles resurrected Dr. Borges
//   as a CURRENT member);
// - member-id matches the filename and ids are unique.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

// Minimal YAML scan — the cards are flat enough for line-level checks,
// and this avoids a parser dependency for lint purposes.
type Card = { file: string; text: string; id: string; deceased: boolean }
const cards: Card[] = readdirSync('_data/members')
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => {
    const text = readFileSync(`_data/members/${f}`, 'utf8')
    const id = /^member-id:\s*(\S+)$/m.exec(text)?.[1] ?? ''
    return { file: f, text, id, deceased: /^deceased:\s*true$/m.test(text) }
  })

describe('member cards', () => {
  it('member-id matches the filename and ids are unique', () => {
    const bad = cards.filter((c) => c.id !== c.file.replace(/\.yaml$/, '')).map((c) => c.file)
    expect(bad).toEqual([])
    const ids = cards.map((c) => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('every role date is a full YYYY-MM-DD', () => {
    const bad: string[] = []
    for (const c of cards) {
      for (const m of c.text.matchAll(/^\s+date:\s*'?([^'\s]+)'?\s*$/gm)) {
        if (!DATE_RE.test(m[1])) bad.push(`${c.file}: date '${m[1]}'`)
      }
    }
    expect(bad).toEqual([])
  })

  it('year-precision dates use the YYYY-01-01 carrier encoding', () => {
    const bad: string[] = []
    for (const c of cards) {
      const lines = c.text.split('\n')
      lines.forEach((line, i) => {
        if (/precision:\s*year/.test(line)) {
          const d = lines[i - 1] ?? ''
          if (!/-01-01\b/.test(d)) bad.push(`${c.file}: '${d.trim()}' + precision: year`)
        }
      })
    }
    expect(bad).toEqual([])
  })

  it('deceased members close every role (open roles resurrect them as current)', () => {
    const bad: string[] = []
    for (const c of cards) {
      if (!c.deceased) continue
      // every to:-block must be closed; a role without `to` inside a
      // deceased card is the Borges trap
      const roleBlocks = c.text.split(/^-\s+id:\s*/m).slice(1)
      for (const b of roleBlocks) {
        if (!/\bto:/.test(b)) bad.push(`${c.file}: role '${b.split('\n')[0].trim()}' has no to-date`)
      }
    }
    expect(bad).toEqual([])
  })
})

// dist-based half — runs only post-build, like the other page contracts.
import { existsSync } from 'node:fs'
const built = existsSync('public/data/members.json')

describe.skipIf(!built)('member output contracts', () => {
  const members = () => JSON.parse(readFileSync('public/data/members.json', 'utf8')) as {
    all: Record<string, { deceased?: boolean; active: boolean; epitaph?: string }>
    current: string[]
    past: string[]
  }

  it('active:false or deceased members are never listed as current', () => {
    const m = members()
    const bad = m.current.filter((id) => {
      const x = m.all[id]
      return x?.active === false || x?.deceased === true
    })
    expect(bad).toEqual([])
  })

  it('deceased members with an epitaph render an In Memoriam section (dist)', () => {
    const unrendered: string[] = []
    for (const [id, m] of Object.entries(members().all)) {
      if (!m?.deceased || !m?.epitaph) continue
      const html = readFileSync(`dist/members/${id}/index.html`, 'utf8')
      if (!html.includes('detail__section--memoriam')) unrendered.push(id)
    }
    expect(unrendered).toEqual([])
  })
})
