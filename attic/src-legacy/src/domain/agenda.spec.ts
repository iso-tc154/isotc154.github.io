import { describe, it, expect } from 'vitest'
import {
  flattenAgenda,
  flattenSession,
  parseLeadingSeq,
  cleanResponsible,
} from './agenda'
import type { AgendaItem, AgendaSession } from '../types/event'

describe('parseLeadingSeq', () => {
  it('extracts a dotted numeric sequence and the remaining title', () => {
    expect(parseLeadingSeq('3.2.1 Adoption of agenda')).toEqual({
      seq: '3.2.1',
      title: 'Adoption of agenda',
    })
    expect(parseLeadingSeq('8.1.1 CIB ballot')).toEqual({
      seq: '8.1.1',
      title: 'CIB ballot',
    })
  })

  it('returns an empty seq when the title is not a dotted sequence followed by text', () => {
    // "1. Foo" is NOT matched -- the regex requires a digit after the dot.
    // In real agenda data, items either use dotted sequences ("1.2 Foo") or
    // carry an explicit `number:` field; bare "1. Foo" is not a shape we
    // expect to extract a sequence from.
    expect(parseLeadingSeq('1. Opening')).toEqual({ seq: '', title: '1. Opening' })
    expect(parseLeadingSeq('Welcome')).toEqual({ seq: '', title: 'Welcome' })
  })
})

describe('cleanResponsible', () => {
  it('replaces underscores with spaces', () => {
    expect(cleanResponsible('WG5_Convenor')).toBe('WG5 Convenor')
    expect(cleanResponsible('a_b_c')).toBe('a b c')
  })

  it('returns empty string for undefined or empty input', () => {
    expect(cleanResponsible(undefined)).toBe('')
    expect(cleanResponsible('')).toBe('')
  })
})

describe('flattenAgenda', () => {
  it('returns an empty array when items is undefined', () => {
    expect(flattenAgenda(undefined)).toEqual([])
  })

  it('uses the explicit number when present, leaving the title untouched', () => {
    const items: AgendaItem[] = [
      { number: 1, title: 'Opening of the meeting', speaker: 'Chair_Pan' },
    ]
    expect(flattenAgenda(items)).toEqual([
      { seq: '1', title: 'Opening of the meeting', responsible: 'Chair Pan', ref: '', depth: 0 },
    ])
  })

  it('parses a dotted leading sequence from titles without an explicit number', () => {
    const items: AgendaItem[] = [
      { title: '8.1.1 CIB ballot', speaker: 'CM' },
    ]
    expect(flattenAgenda(items)).toEqual([
      { seq: '8.1.1', title: 'CIB ballot', responsible: 'CM', ref: '', depth: 0 },
    ])
  })

  it('preserves n_doc as ref and leaves it empty when absent', () => {
    expect(flattenAgenda([{ title: 'Item', n_doc: 'N 123' }])[0].ref).toBe('N 123')
    expect(flattenAgenda([{ title: 'Item' }])[0].ref).toBe('')
  })

  it('walks subitems with increasing depth, in source order', () => {
    const items: AgendaItem[] = [
      {
        number: 1,
        title: 'Top',
        subitems: [
          { title: '1.1 Child A' },
          { title: '1.2 Child B', subitems: [{ title: '1.2.1 Grandchild' }] },
        ],
      },
      { number: 2, title: 'Top' },
    ]
    const rows = flattenAgenda(items)
    expect(rows.map((r) => [r.seq, r.depth])).toEqual([
      ['1', 0],
      ['1.1', 1],
      ['1.2', 1],
      ['1.2.1', 2],
      ['2', 0],
    ])
  })
})

describe('flattenSession', () => {
  it('returns an empty array when session is null or undefined', () => {
    expect(flattenSession(null)).toEqual([])
    expect(flattenSession(undefined)).toEqual([])
  })

  it('flattens the session items', () => {
    const session: AgendaSession = {
      date: '2024-10-28',
      items: [{ number: 1, title: 'Opening' }, { number: 2, title: 'Roll call' }],
    }
    const rows = flattenSession(session)
    expect(rows).toHaveLength(2)
    expect(rows[0].seq).toBe('1')
    expect(rows[1].seq).toBe('2')
  })
})
