import { describe, it, expect } from 'vitest'
import type { Standard } from '../types/standard'
import {
  standardStatusLabel,
  standardByRaw,
  slugifyStandard,
  standardYear,
  standardUrl,
  standardUrlFromRaw,
} from './standardPresentation'

function makeStandard(overrides: Partial<Standard> = {}): Standard {
  return {
    id: 'iso-8601-1-2019',
    iso: { name: 'ISO 8601-1:2019', title: 'Date and time' },
    url: '/standards/iso-8601-1-2019/',
    ...overrides,
  }
}

describe('standardStatusLabel', () => {
  it('labels published', () => {
    expect(standardStatusLabel('published')).toBe('Published')
  })

  it('labels withdrawn', () => {
    expect(standardStatusLabel('withdrawn')).toBe('Withdrawn')
  })

  it('labels under-development (kebab)', () => {
    expect(standardStatusLabel('under-development')).toBe('Under development')
  })

  it('labels under_development (snake) — YAML shape', () => {
    expect(standardStatusLabel('under_development')).toBe('Under development')
  })

  it('labels under-review', () => {
    expect(standardStatusLabel('under-review')).toBe('Under review')
  })

  it('is case-insensitive', () => {
    expect(standardStatusLabel('PUBLISHED')).toBe('Published')
  })

  it('title-cases unknown status', () => {
    expect(standardStatusLabel('drafted')).toBe('Drafted')
  })

  it('returns empty string for undefined', () => {
    expect(standardStatusLabel(undefined)).toBe('')
  })
})

describe('standardByRaw', () => {
  it('finds a standard by iso.name', () => {
    const list = [makeStandard(), makeStandard({ id: 'iso-34000', iso: { name: 'ISO 34000:2023' } })]
    expect(standardByRaw(list, 'ISO 34000:2023')?.id).toBe('iso-34000')
  })

  it('returns undefined when no match', () => {
    expect(standardByRaw([], 'ISO 9999:1999')).toBeUndefined()
  })
})

describe('slugifyStandard', () => {
  it('lowercases and hyphenates', () => {
    expect(slugifyStandard('ISO 8601-1:2019')).toBe('iso-8601-1-2019')
  })

  it('collapses runs of non-alphanumerics', () => {
    expect(slugifyStandard('ISO/AWI 34000')).toBe('iso-awi-34000')
  })

  it('trims leading and trailing hyphens', () => {
    expect(slugifyStandard('--weird--')).toBe('weird')
  })
})

describe('standardYear', () => {
  it('extracts year from publication_date', () => {
    const s = makeStandard({ iso: { name: 'X', publication_date: '2019-10-15' } })
    expect(standardYear(s)).toBe('2019')
  })

  it('returns empty when missing', () => {
    expect(standardYear(makeStandard())).toBe('')
  })

  it('returns empty for undefined standard', () => {
    expect(standardYear(undefined)).toBe('')
  })
})

describe('standardUrl', () => {
  it('uses standardPath with the id', () => {
    expect(standardUrl(makeStandard({ id: 'iso-8601-1-2019' }))).toBe('/standards/iso-8601-1-2019/')
  })
})

describe('standardUrlFromRaw', () => {
  it('resolves via matched standard id', () => {
    const list = [makeStandard({ id: 'iso-8601-1-2019', iso: { name: 'ISO 8601-1:2019' } })]
    expect(standardUrlFromRaw(list, 'ISO 8601-1:2019')).toBe('/standards/iso-8601-1-2019/')
  })

  it('falls back to slugified raw when no match', () => {
    expect(standardUrlFromRaw([], 'ISO 8601-1:2019')).toBe('/standards/iso-8601-1-2019/')
  })
})
