import { describe, it, expect } from 'vitest'
import {
  resolutionPath,
  resolutionRefSearchPath,
  memberPath,
  liaisonPath,
} from './urn'

describe('resolutionPath', () => {
  it('builds the canonical detail path from source_type/source_file/id', () => {
    expect(resolutionPath('plenary', 'plenary-32', '003-2013')).toBe(
      '/resolutions/plenary/plenary-32/003-2013/',
    )
  })
})

describe('resolutionRefSearchPath', () => {
  it('builds a search-style path for a ref-only link', () => {
    expect(resolutionRefSearchPath('003-2013')).toBe('/resolutions/?q=003-2013')
  })

  it('URL-encodes refs containing special characters', () => {
    expect(resolutionRefSearchPath('P-2025-10')).toBe('/resolutions/?q=P-2025-10')
    expect(resolutionRefSearchPath('2023/19')).toBe('/resolutions/?q=2023%2F19')
  })
})

describe('memberPath', () => {
  it('builds a member detail path', () => {
    expect(memberPath('klaus-dieter-naujok')).toBe('/members/klaus-dieter-naujok/')
  })
})

describe('liaisonPath', () => {
  it('builds a liaison detail path', () => {
    expect(liaisonPath('unece')).toBe('/liaisons/unece/')
  })
})
