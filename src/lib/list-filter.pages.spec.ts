// @vitest-environment happy-dom
// Integration: mounts the real list-filter controller against the REAL
// built pages in dist/. Guards the page-side half of the module contract
// (data-haystack for search, data-{facet} for chips) — attribute drift
// here is exactly what issue #120 was. Skipped unless dist/ exists (CI
// runs tests before build; run pnpm build first locally).
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'
import { mountListFilter } from './list-filter'

const built = (...pages: string[]) => pages.every((p) => existsSync(`dist/${p}/index.html`))

function loadPage(page: string, cfg: Record<string, string | undefined>): void {
  document.body.innerHTML = readFileSync(`dist/${page}/index.html`, 'utf-8')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<style[\s\S]*?<\/style>/g, '')
  mountListFilter(cfg as never)
}

const visibleCount = (sel: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(sel)).filter((el) => el.style.display !== 'none').length

const MEMBERS_CFG = {
  searchInput: '#member-search',
  items: '#member-grid > li',
  facetWrappers: '.filter__chips[data-facet]',
  count: '#member-count',
  empty: '#member-empty',
  clear: '#member-clear',
}

describe.skipIf(!built('members'))('members page filters', () => {
  it('role chip narrows the list (issue #120 regression)', () => {
    loadPage('members', MEMBERS_CFG)
    const total = visibleCount('#member-grid > li')
    const chip = document.querySelector<HTMLElement>('[data-facet="role"] .chip[data-value]:not([data-value=""])')!
    chip.click()
    const filtered = visibleCount('#member-grid > li')
    expect(total).toBeGreaterThan(0)
    expect(filtered).toBeGreaterThan(0)
    expect(filtered).toBeLessThan(total)
  })

  it('group chip narrows the list', () => {
    loadPage('members', MEMBERS_CFG)
    const chip = document.querySelector<HTMLElement>('[data-facet="group"] .chip[data-value]:not([data-value=""])')!
    chip.click()
    expect(visibleCount('#member-grid > li')).toBeGreaterThan(0)
  })

  it('search matches by name', () => {
    loadPage('members', MEMBERS_CFG)
    const q = document.querySelector<HTMLInputElement>('#member-search')!
    q.value = 'wei'
    q.dispatchEvent(new Event('input'))
    expect(visibleCount('#member-grid > li')).toBeGreaterThan(0)
  })
})

describe.skipIf(!built('meetings'))('meetings page filters', () => {
  it('type chip narrows the list', () => {
    loadPage('meetings', {
      searchInput: '#mtg-search',
      items: '#mtg-index .ucard, #mtg-index .entry',
      facetWrappers: '#mtg-filter .filter-chips',
      count: '#mtg-count',
    })
    const items = () => visibleCount('#mtg-index .ucard, #mtg-index .entry')
    const before = items()
    const chip = document.querySelector<HTMLElement>('[data-facet="type"] .chip[data-value]:not([data-value=""])')!
    chip.click()
    const after = items()
    expect(before).toBeGreaterThan(0)
    expect(after).toBeGreaterThan(0)
    expect(after).toBeLessThan(before)
  })
})

describe.skipIf(!built('standards'))('standards page search', () => {
  it('finds ISO 8601', () => {
    loadPage('standards', {
      searchInput: '#filter-search',
      items: '#std-grid > li',
      facetWrappers: '.filter__chips[data-facet]',
      count: '#filter-count',
      empty: '#std-empty',
      clear: '#std-clear',
    })
    const q = document.querySelector<HTMLInputElement>('#filter-search')!
    q.value = '8601'
    q.dispatchEvent(new Event('input'))
    expect(visibleCount('#std-grid > li')).toBeGreaterThan(0)
  })
})
