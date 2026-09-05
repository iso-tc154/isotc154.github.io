// Payload budget, run against the real dist/ (post-build CI pass).
// Born from the OpenLayers incident (review 6): 4.2 MB of unreferenced
// vendored JS shipped unnoticed. Budgets sit ~1.5-2x above current
// reality (39 MB total, 0.9 MB largest non-PDF asset) — re-negotiate in
// a PR when content growth legitimately crosses them.
import { describe, it, expect } from 'vitest'
import { existsSync, readdirSync, statSync } from 'node:fs'
import path from 'node:path'

const built = existsSync('dist/index.html')

const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? walk(p) : [p]
  })

describe.skipIf(!built)('asset budget', () => {
  it('no vendored asset directories ship (the OpenLayers shape)', () => {
    expect(existsSync(path.join('dist', 'assets/vendor'))).toBe(false)
  })

  it('no single non-PDF asset exceeds 1.5 MB', () => {
    const oversized = walk('dist')
      .filter((f) => !f.endsWith('.pdf'))
      .map((f) => ({ f, size: statSync(f).size }))
      .filter(({ size }) => size > 1.5 * 1024 * 1024)
      .map(({ f, size }) => `${(size / 1048576).toFixed(1)}MB ${f}`)
    expect(oversized).toEqual([])
  })

  it('total dist stays under 50 MB', () => {
    const total = walk('dist').reduce((s, f) => s + statSync(f).size, 0)
    expect(total).toBeLessThan(50 * 1024 * 1024)
  })
})
