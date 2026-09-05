// Page-quality invariants over every Astro-rendered page in dist/
// (post-build CI pass). Redirect stubs (noindex meta-refresh, by design)
// and /decisions/ (rendered by @edoxen/browser, gated separately by
// `edoxen-browser check`) are out of scope.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync, readdirSync } from 'node:fs'
import path from 'node:path'

const built = existsSync('dist/index.html')

const pages = (): string[] => {
  const out: string[] = []
  const walk = (d: string) => {
    for (const e of readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name)
      if (e.isDirectory()) walk(p)
      else if (e.name === 'index.html') out.push(p)
    }
  }
  walk('dist')
  return out.filter((p) => {
    const html = readFileSync(p, 'utf8')
    if (httpEquivRefresh(html)) return false // redirect stub
    return !p.startsWith(`dist${path.sep}decisions${path.sep}`)
  })
}

const httpEquivRefresh = (html: string) => /http-equiv="refresh"/.test(html)

describe.skipIf(!built)('page quality (a11y/SEO)', () => {
  it('every Astro page declares html lang', () => {
    const bad = pages().filter((p) => !/<html[^>]*\blang=/.test(readFileSync(p, 'utf8')))
    expect(bad.slice(0, 5)).toEqual([])
    expect(bad).toHaveLength(0)
  })

  it('every Astro page has a title and meta description', () => {
    const noTitle = pages().filter((p) => !/<title>[^<]{3,}<\/title>/.test(readFileSync(p, 'utf8')))
    const noDesc = pages().filter((p) => !/name="description"/.test(readFileSync(p, 'utf8')))
    expect(noTitle).toEqual([])
    expect(noDesc).toEqual([])
  })

  it('every Astro page has exactly one h1', () => {
    const bad = pages()
      .map((p) => ({ p, n: (readFileSync(p, 'utf8').match(/<h1[\s>]/g) ?? []).length }))
      .filter(({ n }) => n !== 1)
    expect(bad.slice(0, 5).map((b) => `${b.n} h1: ${b.p}`)).toEqual([])
    expect(bad).toHaveLength(0)
  })

  it('every img has alt text', () => {
    const bad = pages().filter((p) =>
      (readFileSync(p, 'utf8').match(/<img[^>]*>/g) ?? []).some((img) => !/\salt=/.test(img)),
    )
    expect(bad.slice(0, 5)).toEqual([])
    expect(bad).toHaveLength(0)
  })
})
