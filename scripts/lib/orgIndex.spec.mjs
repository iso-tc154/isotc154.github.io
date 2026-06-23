import { describe, it, expect } from 'vitest'
import { buildOrgIndex } from './orgIndex.mjs'

describe('buildOrgIndex', () => {
  const nb = (id, extra = {}) => ({
    id,
    name: id.toUpperCase(),
    short_name: id.toUpperCase(),
    country: 'XX',
    ...extra,
  })
  const liaison = (id, extra = {}) => ({
    id,
    name: id,
    ...extra,
  })
  const associate = (id, extra = {}) => ({
    id,
    name: id,
    ...extra,
  })

  it('resolves by id, short_name, legal name, and alias', () => {
    const idx = buildOrgIndex(
      [nb('din', { name: 'Deutsches Institut für Normung', aliases: ['German Institute'] })],
      [],
      [],
    )
    expect(idx.lookup('din')?.ref).toBe('din')
    expect(idx.lookup('DIN')?.ref).toBe('din')
    expect(idx.lookup('Deutsches Institut für Normung')?.ref).toBe('din')
    expect(idx.lookup('German Institute')?.ref).toBe('din')
  })

  it('indexes "SHORT (Country)" parenthetical form', () => {
    const idx = buildOrgIndex([nb('din', { short_name: 'DIN', country: 'Germany' })], [], [])
    expect(idx.lookup('DIN (Germany)')?.ref).toBe('din')
  })

  it('national bodies override liaisons on name collision', () => {
    const idx = buildOrgIndex(
      [nb('iso', { name: 'ISO' })],
      [liaison('iso', { name: 'ISO' })],
      [],
    )
    expect(idx.lookup('iso')?.type).toBe('national-body')
  })

  it('liaisons override associates on name collision', () => {
    const idx = buildOrgIndex(
      [],
      [liaison('ieee', { name: 'IEEE' })],
      [associate('ieee', { name: 'IEEE' })],
    )
    expect(idx.lookup('ieee')?.type).toBe('liaison')
  })

  it('national bodies override associates on name collision', () => {
    const idx = buildOrgIndex(
      [nb('ansi', { name: 'ANSI' })],
      [],
      [associate('ansi', { name: 'ANSI' })],
    )
    expect(idx.lookup('ansi')?.type).toBe('national-body')
  })

  it('returns null for unknown token', () => {
    const idx = buildOrgIndex([nb('din')], [], [])
    expect(idx.lookup('unknown')).toBeNull()
  })

  it('returns null for empty/whitespace token', () => {
    const idx = buildOrgIndex([nb('din')], [], [])
    expect(idx.lookup('')).toBeNull()
    expect(idx.lookup('   ')).toBeNull()
    expect(idx.lookup(undefined)).toBeNull()
  })

  it('lookup with hintType rejects mismatches', () => {
    const idx = buildOrgIndex([nb('din')], [liaison('ieee')], [])
    expect(idx.lookup('din', 'liaison')).toBeNull()
    expect(idx.lookup('din', 'national-body')?.ref).toBe('din')
  })

  it('lookupAny accepts a set of acceptable types', () => {
    const idx = buildOrgIndex([nb('din')], [liaison('ieee')], [])
    expect(idx.lookupAny('din', ['liaison', 'national-body'])?.ref).toBe('din')
    expect(idx.lookupAny('din', ['liaison'])).toBeNull()
  })

  it('sets path via nationalBodyPath for national bodies', () => {
    const idx = buildOrgIndex([nb('din')], [], [])
    expect(idx.lookup('din')?.path).toBe('/national-bodies/din/')
  })

  it('sets path via liaisonPath for liaisons', () => {
    const idx = buildOrgIndex([], [liaison('ieee')], [])
    expect(idx.lookup('ieee')?.path).toBe('/liaisons/ieee/')
  })

  it('uses null path for associates (no detail page)', () => {
    const idx = buildOrgIndex([], [], [associate('acme')])
    expect(idx.lookup('acme')?.path).toBeNull()
  })

  it('skips records without an id', () => {
    const idx = buildOrgIndex([nb('din'), { name: 'orphan' }], [], [])
    expect(idx.lookup('orphan')).toBeNull()
    expect(idx.lookup('din')?.ref).toBe('din')
  })

  it('handles empty inputs without error', () => {
    const idx = buildOrgIndex([], [], [])
    expect(idx.lookup('anything')).toBeNull()
  })
})
