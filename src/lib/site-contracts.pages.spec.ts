// Build-output contracts, run against the real dist/ (CI's build job
// re-runs tests post-build for exactly this family; skipped pre-build).
// These specs gate the deploy on surfaces users actually hit: the 600+
// legacy redirects, the sitemap, and the 404 page.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import path from 'node:path'

const built = existsSync('dist/index.html')

const pageExists = (url: string): boolean => {
  if (!url.startsWith('/')) return true // external / anchor / non-page
  const clean = decodeURIComponent(url.split('#')[0].split('?')[0]).replace(/\/+$/, '')
  if (clean === '') return existsSync('dist/index.html')
  return (
    existsSync(path.join('dist', clean, 'index.html')) ||
    existsSync(path.join('dist', `${clean}.html`))
  )
}

describe.skipIf(!built)('legacy redirects (src/data/legacy-redirects.json)', () => {
  const redirects: Record<string, string> = JSON.parse(readFileSync('src/data/legacy-redirects.json', 'utf8'))
  const entries = Object.entries(redirects)

  it('carries a populated map', () => {
    expect(entries.length).toBeGreaterThan(500)
  })

  it('every source is emitted as a redirect page to its recorded target', () => {
    const broken: string[] = []
    for (const [from, to] of entries) {
      const file = path.join('dist', from.replace(/\/+$/, ''), 'index.html')
      if (!existsSync(file)) { broken.push(`${from}: no redirect page`); continue }
      const html = readFileSync(file, 'utf8')
      if (!html.includes(`content="0;url=${to}"`)) broken.push(`${from}: refresh does not point at ${to}`)
    }
    expect(broken.slice(0, 10)).toEqual([])
    expect(broken).toHaveLength(0)
  })

  it('every redirect target is a built page', () => {
    const dangling = entries.filter(([, to]) => !pageExists(to)).map(([from, to]) => `${from} → ${to}`)
    expect(dangling.slice(0, 10)).toEqual([])
    expect(dangling).toHaveLength(0)
  })
})

describe.skipIf(!built)('sitemap', () => {
  const locs = () =>
    [...readFileSync('dist/sitemap-0.xml', 'utf8').matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1])

  it('is populated', () => {
    expect(locs().length).toBeGreaterThan(1000)
  })

  it('every sitemap URL is a built page on this domain', () => {
    const broken = locs()
      .filter((u) => u.startsWith('https://www.isotc154.org/'))
      .map((u) => new URL(u).pathname)
      .filter((p) => !pageExists(p))
    expect(broken.slice(0, 10)).toEqual([])
    expect(broken).toHaveLength(0)
  })
})

describe.skipIf(!built)('error page', () => {
  it('404.html is built and links home', () => {
    const html = readFileSync('dist/404.html', 'utf8')
    expect(html).toContain('href="/"')
  })
})
