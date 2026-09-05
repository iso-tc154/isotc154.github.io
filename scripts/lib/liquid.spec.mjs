import { describe, it, expect } from 'vitest'
import { renderLiquid, hasLiquid } from './liquid.mjs'

const site = {
  data: {
    members: {
      all: {
        'jane': { name: 'Jane Doe', affiliation: 'ACME' },
        'bob': { name: 'Bob Roe', affiliation: 'ZENITH' },
      },
    },
  },
  groups: [
    { id: 'wg2', name: 'Syntax', order: 2 },
    { id: 'wg1', name: 'Context', order: 1 },
    { id: 'wg9', name: 'Dates', order: null },
  ],
}

describe('renderLiquid — output paths', () => {
  it('resolves dotted and bracket-literal paths against site', () => {
    expect(renderLiquid('{{ site.data.members.all.jane.name }}', site)).toBe('Jane Doe')
    expect(renderLiquid("{{ site.data.members.all['jane']['affiliation'] }}", site)).toBe('ACME')
  })
  it('numeric indices walk arrays', () => {
    expect(renderLiquid('{{ site.groups[0].name }}', site)).toBe('Syntax')
  })
  it('undefined paths render empty, never "undefined"', () => {
    expect(renderLiquid('{{ site.data.members.all.nobody.name }}', site)).toBe('')
    expect(renderLiquid('{{ site.nope.also_nope }}', site)).toBe('')
  })
})

describe('renderLiquid — tags', () => {
  it('assign then output', () => {
    const t = '{% assign chair = site.data.members.all.jane %}{{ chair.name }}'
    expect(renderLiquid(t, site)).toBe('Jane Doe')
  })
  it('for loops iterate with a scoped variable', () => {
    const t = '{% for g in site.groups %}{{ g.id }},{% endfor %}'
    expect(renderLiquid(t, site)).toBe('wg2,wg1,wg9,')
  })
  it('if guards on Liquid truthiness', () => {
    const t = '{% if site.data.members.all.jane %}yes{% endif %}'
    expect(renderLiquid(t, site)).toBe('yes')
    expect(renderLiquid('{% if site.data.members.all.nobody %}yes{% endif %}', site)).toBe('')
    expect(renderLiquid('{% if site.nope %}yes{% endif %}', site)).toBe('')
  })
  it('empty-string, zero and empty-array are falsy; non-empty is truthy', () => {
    expect(renderLiquid("{% assign e = '' %}{% if e %}y{% endif %}", site)).toBe('')
    expect(renderLiquid('{% assign z = 0 %}{% if z %}y{% endif %}', site)).toBe('')
    expect(renderLiquid('{% if site.empty_list %}y{% endif %}', { ...site, empty_list: [] })).toBe('')
    expect(renderLiquid('{% if site.count %}y{% endif %}', { ...site, count: 1 })).toBe('y')
    expect(renderLiquid('{% if site.label %}y{% endif %}', { ...site, label: 'x' })).toBe('y')
  })
  it('unclosed and mismatched blocks throw', () => {
    expect(() => renderLiquid('{% for g in site.groups %}x', site)).toThrow(/Unclosed/)
    expect(() => renderLiquid('{% if true %}{% endfor %}', site)).toThrow(/endfor/)
  })
})

describe('renderLiquid — sort filter', () => {
  it('bare sort orders scalars', () => {
    const t = '{% assign xs = site.letters | sort %}{% for x in xs %}{{ x }}{% endfor %}'
    expect(renderLiquid(t, { ...site, letters: ['c', 'a', 'b'] })).toBe('abc')
  })
  it('field sort orders objects and pushes nulls last', () => {
    const t = '{% assign gs = site.groups | sort: "order" %}{% for g in gs %}{{ g.id }},{% endfor %}'
    expect(renderLiquid(t, site)).toBe('wg1,wg2,wg9,')
  })
  it('field sort compares numbers numerically', () => {
    const t = '{% assign gs = site.groups | sort: "order" %}{{ gs[0].id }},{{ gs[1].id }},{{ gs[2].id }}'
    expect(renderLiquid(t, site)).toBe('wg1,wg2,wg9')
  })
})

describe('renderLiquid — whitespace', () => {
  it('collapses 3+ newlines left by tag-only lines to a paragraph break', () => {
    const t = 'para one\n\n{% assign x = site.groups %}\n\npara two'
    expect(renderLiquid(t, site)).toBe('para one\n\npara two')
  })
})

describe('hasLiquid', () => {
  it('detects either delimiter family', () => {
    expect(hasLiquid('{{ x }}')).toBe(true)
    expect(hasLiquid('{% if x %}y{% endif %}')).toBe(true)
    expect(hasLiquid('plain AsciiDoc')).toBe(false)
  })
})
