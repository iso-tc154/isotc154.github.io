// The palette convention, machine-enforced: no hex color literals in
// style blocks outside the token definitions themselves. main.css owns
// the @theme/:root definitions; override.css carries its own --ov-*
// mirror because /decisions/ never loads main.css. Display-data
// palettes (calendar, history categories) live in .ts data files, not
// styles, and are out of scope. 8-digit alpha tints (rgb() equivalents)
// are permitted.
import { describe, it, expect } from 'vitest'
import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'

const HEX_RE = /#[0-9a-fA-F]{3}(?![0-9a-fA-F])\b|#[0-9a-fA-F]{6}(?![0-9a-fA-F])/

const allowed = (f: string) => f.endsWith('main.css') || f.endsWith('override.css')

const find = (dir: string, ext: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? find(p, ext) : p.endsWith(ext) ? [p] : []
  })

describe('palette lint', () => {
  it('no hex literals in shared CSS files', () => {
    const bad = find('src/styles', '.css')
      .filter((f) => !allowed(f))
      .filter((f) => HEX_RE.test(readFileSync(f, 'utf8')))
    expect(bad).toEqual([])
  })

  it('no hex literals in .astro style blocks', () => {
    const bad = find('src', '.astro')
      .filter((f) =>
        (readFileSync(f, 'utf8').match(/<style[\s\S]*?<\/style>/g) ?? [])
          .some((block) => HEX_RE.test(block)),
      )
    expect(bad).toEqual([])
  })
})
