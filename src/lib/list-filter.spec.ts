// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from 'vitest'
import { mountListFilter } from './list-filter'

function fixture() {
  document.body.innerHTML = `
    <input id="q" type="search" />
    <div data-facet="category">
      <button class="chip chip--active" data-value="">All</button>
      <button class="chip" data-value="working">Working</button>
      <button class="chip" data-value="advisory">Advisory</button>
    </div>
    <div data-facet="status">
      <button class="chip chip--active" data-value="">All</button>
      <button class="chip" data-value="active">Active</button>
    </div>
    <ul>
      <li class="item" data-haystack="wg5 processes" data-category="working" data-status="active">WG5</li>
      <li class="item" data-haystack="cag advice" data-category="advisory" data-status="active">CAG</li>
      <li class="item" data-haystack="old working group" data-category="working" data-status="dissolved">WG1</li>
    </ul>
    <section class="sec" id="sec1"><li class="item" data-haystack="wg5 processes" data-category="working" data-status="active">WG5</li></section>
    <section class="sec" id="sec2"><li class="item" data-haystack="cag advice" data-category="advisory" data-status="active">CAG</li></section>
    <span id="count"></span>
    <div id="empty" hidden><button id="clear">Clear</button></div>
  `
}

function mount() {
  mountListFilter({
    searchInput: '#q',
    items: 'ul .item',
    facetWrappers: '[data-facet]',
    count: '#count',
    countLabel: 'groups',
    empty: '#empty',
    clear: '#clear',
    sections: '.sec',
  })
}

const itemEls = () => Array.from(document.querySelectorAll<HTMLElement>('ul .item'))
const visible = () => itemEls().filter((el) => el.style.display !== 'none').map((el) => el.textContent)
const chip = (facet: string, value: string) =>
  document.querySelector(`[data-facet="${facet}"] .chip[data-value="${value}"]`) as HTMLElement

beforeEach(() => {
  fixture()
})

describe('mountListFilter', () => {
  it('shows everything and reports the total on mount', () => {
    mount()
    expect(visible()).toEqual(['WG5', 'CAG', 'WG1'])
    expect(document.querySelector('#count')!.textContent).toBe('3 of 3 groups')
    expect(document.querySelector('#empty')!.hidden).toBe(true)
  })

  it('filters by haystack search', () => {
    mount()
    const q = document.querySelector<HTMLInputElement>('#q')!
    q.value = 'cag'
    q.dispatchEvent(new Event('input'))
    expect(visible()).toEqual(['CAG'])
    expect(document.querySelector('#count')!.textContent).toBe('1 of 3 groups')
  })

  it('matches facets by list-contains on |-separated values', () => {
    mount()
    chip('category', 'working').click()
    expect(visible()).toEqual(['WG5', 'WG1'])
    chip('status', 'active').click()
    expect(visible()).toEqual(['WG5'])
  })

  it('combines search with facets', () => {
    mount()
    chip('category', 'working').click()
    const q = document.querySelector<HTMLInputElement>('#q')!
    q.value = 'old'
    q.dispatchEvent(new Event('input'))
    expect(visible()).toEqual(['WG1'])
  })

  it('shows the empty state and hides sections when nothing matches', () => {
    mount()
    const q = document.querySelector<HTMLInputElement>('#q')!
    q.value = 'zzz'
    q.dispatchEvent(new Event('input'))
    expect(visible()).toEqual([])
    expect(document.querySelector('#empty')!.hidden).toBe(false)
    expect((document.querySelector('#sec1') as HTMLElement).style.display).toBe('none')
    expect((document.querySelector('#sec2') as HTMLElement).style.display).toBe('none')
  })

  it('clear resets search, chips, and count', () => {
    mount()
    chip('category', 'working').click()
    document.querySelector<HTMLInputElement>('#q')!.value = 'wg'
    document.querySelector<HTMLInputElement>('#q')!.dispatchEvent(new Event('input'))
    document.querySelector('#clear')!.click()
    expect(visible()).toEqual(['WG5', 'CAG', 'WG1'])
    expect(document.querySelector('#count')!.textContent).toBe('3 of 3 groups')
    expect(chip('category', '').classList.contains('chip--active')).toBe(true)
  })
})
