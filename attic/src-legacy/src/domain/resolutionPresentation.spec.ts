import { describe, it, expect } from 'vitest'
import {
  uniqueActionTypes,
  actionTypeFacets,
  yearFacets,
  yearRange,
  compareResolutions,
  searchResolutions,
} from './resolutionPresentation'
import type { Resolution, Action } from '../types/resolution'

const action = (type: string): Action => ({ type, message: `m:${type}` })

const mk = (id: string, year: string, actions: Action[] = [], extras: Partial<Resolution> = {}): Resolution => ({
  id,
  urn: `urn:iso:tc154:res:${id}`,
  title: `Resolution ${id}`,
  subject: 'subject',
  year,
  venue: 'Geneva',
  source_type: 'plenary',
  source_file: 'p44',
  source_title: 'P44',
  meeting_date: `${year}-10-15`,
  is_acclamation: false,
  actions,
  considerations: [],
  approvals: [],
  dates: [],
  snippet: '',
  meeting_urn: 'urn:iso:tc154:meeting:p44',
  path: `/resolutions/${id}/`,
  ...extras,
})

describe('uniqueActionTypes', () => {
  it('returns distinct types in first-appearance order', () => {
    const r = mk('a', '2024', [action('resolves'), action('approves'), action('resolves')])
    expect(uniqueActionTypes(r)).toEqual(['resolves', 'approves'])
  })

  it('returns [] for resolutions without actions', () => {
    expect(uniqueActionTypes(mk('a', '2024'))).toEqual([])
    expect(uniqueActionTypes(mk('a', '2024', []))).toEqual([])
  })

  it('ignores actions without a type', () => {
    const r = mk('a', '2024', [action('resolves'), { type: '', message: 'no-type' } as Action])
    expect(uniqueActionTypes(r)).toEqual(['resolves'])
  })
})

describe('actionTypeFacets', () => {
  it('lists all distinct types alphabetically', () => {
    const list = [
      mk('a', '2024', [action('approves')]),
      mk('b', '2023', [action('resolves')]),
      mk('c', '2022', [action('takes-note')]),
    ]
    expect(actionTypeFacets(list).all).toEqual(['approves', 'resolves', 'takes-note'])
  })

  it('ranks top by frequency then alphabetically', () => {
    const list = [
      mk('a', '2024', [action('resolves')]),
      mk('b', '2024', [action('resolves'), action('approves')]),
      mk('c', '2023', [action('resolves')]),
      mk('d', '2022', [action('approves')]),
    ]
    // resolves appears 3×, approves 2× → resolves first; only 2 distinct → top == all
    expect(actionTypeFacets(list).top).toEqual(['resolves', 'approves'])
  })

  it('caps top at topN', () => {
    const list = [
      mk('a', '2024', [action('a'), action('b'), action('c'), action('d')]),
    ]
    expect(actionTypeFacets(list, 2).top).toEqual(['a', 'b'])
  })
})

describe('yearFacets', () => {
  it('returns distinct years sorted descending', () => {
    const list = [mk('a', '2022'), mk('b', '2024'), mk('c', '2022'), mk('d', '2023')]
    expect(yearFacets(list)).toEqual(['2024', '2023', '2022'])
  })

  it('skips resolutions without a year', () => {
    const list = [mk('a', ''), mk('b', '2024')]
    expect(yearFacets(list)).toEqual(['2024'])
  })

  it('returns [] for empty input', () => {
    expect(yearFacets([])).toEqual([])
  })
})

describe('yearRange', () => {
  it('returns earliest and latest years', () => {
    const list = [mk('a', '2018'), mk('b', '2024'), mk('c', '2021')]
    expect(yearRange(list)).toEqual({ earliest: '2018', latest: '2024' })
  })

  it('returns empty strings when no year is present', () => {
    expect(yearRange([mk('a', ''), mk('b', '')])).toEqual({ earliest: '', latest: '' })
    expect(yearRange([])).toEqual({ earliest: '', latest: '' })
  })
})

describe('compareResolutions', () => {
  const a = mk('a', '2024', [action('x')])
  const b = mk('b', '2023', [action('x'), action('y')])
  const c = mk('c', '2024', [])

  it('newest: descending year, then descending id', () => {
    expect([b, a, c].sort(compareResolutions('newest')).map((r) => r.id)).toEqual(['c', 'a', 'b'])
  })

  it('oldest: ascending year, then ascending id', () => {
    expect([c, a, b].sort(compareResolutions('oldest')).map((r) => r.id)).toEqual(['b', 'a', 'c'])
  })

  it('most_actions: descending action count, then descending year', () => {
    expect([a, c, b].sort(compareResolutions('most_actions')).map((r) => r.id)).toEqual(['b', 'a', 'c'])
  })
})

describe('searchResolutions', () => {
  const list = [
    mk('001-2024', '2024', [], { title: 'Adoption of EDIFACT revision', subject: 'syntax' }),
    mk('002-2023', '2023', [], { title: 'Establishment of WG 7', venue: 'Beijing' }),
    mk('003-2022', '2022', [], { title: 'Re-numbering of JWG 2', subject: 'e-documents' }),
  ]

  it('matches across title, id, subject, venue (case-insensitive)', () => {
    expect(searchResolutions(list, 'EDIFACT').map((r) => r.id)).toEqual(['001-2024'])
    expect(searchResolutions(list, '002').map((r) => r.id)).toEqual(['002-2023'])
    expect(searchResolutions(list, 'e-documents').map((r) => r.id)).toEqual(['003-2022'])
    expect(searchResolutions(list, 'BEIJING').map((r) => r.id)).toEqual(['002-2023'])
  })

  it('returns [] for empty or whitespace queries', () => {
    expect(searchResolutions(list, '')).toEqual([])
    expect(searchResolutions(list, '   ')).toEqual([])
  })
})
