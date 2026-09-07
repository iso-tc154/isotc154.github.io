// Data contracts of the decisions registry, over the built decisions
// data (post-build CI pass). Born from the 2026-09-05 audit: 213
// decisions shipped without titles (raw URNs in the title slot) and an
// invented action verb ('appreciates') hid the Borges memorial under
// the action facet's 12-verb cutoff.
import { describe, it, expect } from 'vitest'
import { readFileSync, existsSync } from 'node:fs'

const built = existsSync('dist/data/decisions.json')

// The action-verb census of the registry, post-cleanup (resolutions-data
// PR #41: request/estabilishes typos, recognize→recognise, appreciates→
// thanks). Twelve of these sit in the facet's top-12 rendering
// (@edoxen/browser MAX_ACTION_FACETS); the rest are established but
// under the cutoff. Extending this set is a deliberate editorial
// decision, not a typo.
const HOUSE_VERBS = new Set([
  'resolves', 'thanks', 'requests', 'appoints', 'establishes', 'encourages',
  'adopts', 'confirms', 'approves', 'disbands', 'notes', 'welcomes',
  'recommends', 'restates', 'agrees', 'decides', 'withdraws', 'supports',
  'assigns', 'accepts', 'allocates', 'endorses', 'recognises', 'asks',
  'defines', 'acknowledges', 'creates', 'nominates', 'sends', 'regrets',
  'secures', 'directs', 'notifies', 'communicating', 'gathering', 'drafting',
  'delivering', 'appreciation', 'delegates', 'registers', 'replaces',
  'reminds', 'elects', 'consults', 'investigates', 'instructs', 'empowers',
  'chairs', 'identifies', 'considers', 'scopes',
])
describe.skipIf(!built)('decisions registry data', () => {
  const items = () => {
    const d = JSON.parse(readFileSync('dist/data/decisions.json', 'utf8')) as Record<string, unknown>
    return (Array.isArray(d.items) ? d.items : Array.isArray(d.decisions) ? d.decisions : Object.values(d)) as Array<Record<string, unknown>>
  }

  it('every decision has a non-empty title', () => {
    const untitled = items().filter((x) => !x.title || !String(x.title).trim()).map((x) => String(x.urn ?? x.id))
    expect(untitled.slice(0, 5)).toEqual([])
    expect(untitled).toHaveLength(0)
  })

  it('every action verb is a house verb (facets render only the known set)', () => {
    const verbs = new Set<string>()
    const foreign: string[] = []
    for (const x of items()) {
      const at = (x.actionTypes ?? x.actions ?? []) as unknown[]
      for (const v of at) {
        const s = typeof v === 'string' ? v : String((v as Record<string, unknown>).type ?? '')
        verbs.add(s)
        if (!HOUSE_VERBS.has(s)) foreign.push(`${s} (${String(x.urn ?? '')})`)
      }
    }
    expect(foreign.slice(0, 5)).toEqual([])
    expect(foreign).toHaveLength(0)
  })

  it('every decision URN has a built detail page', () => {
    const missing = items()
      .map((x) => String(x.urn ?? ''))
      .filter(Boolean)
      .filter((urn) => !existsSync(`dist/decisions/${urn}/index.html`))
    expect(missing.slice(0, 5)).toEqual([])
    expect(missing).toHaveLength(0)
  })
})
