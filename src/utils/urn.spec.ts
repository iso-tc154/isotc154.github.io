import { describe, it, expect } from 'vitest'
import {
  resolutionPath,
  resolutionRefSearchPath,
  memberPath,
  liaisonPath,
  resolutionUrn,
  meetingUrnFromParts,
  meetingDetailPathFromParts,
  standardUrn,
  projectUrn,
  memberUrn,
  parseMeetingParam,
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

describe('resolutionUrn', () => {
  it('composes the registry URN base', () => {
    expect(resolutionUrn('2023-01')).toBe('urn:iso:tc:154:resolution:2023-01')
  })
})

// Meeting URNs compose kind:raw (e.g. meeting:plenary:plenary-31), distinct
// from the historical dash-form urn:iso-tc154:* that events-edoxen carries.
describe('meetingUrnFromParts', () => {
  it('plenary sources compose kind:raw', () => {
    expect(meetingUrnFromParts('plenary', 'plenary-31')).toBe('urn:iso:tc:154:meeting:plenary:plenary-31')
  })
  it('ballot sources carry their year kind', () => {
    expect(meetingUrnFromParts('ballots', 'ballots-2026')).toBe('urn:iso:tc:154:meeting:ballots:ballots-2026')
  })
  it('unknown sources fall back to type:file composition', () => {
    expect(meetingUrnFromParts('wg', 'wg-4')).toBe('urn:iso:tc:154:meeting:wg:wg-4')
  })
})

describe('meetingDetailPathFromParts', () => {
  it('plenary resolves to the native meeting page', () => {
    expect(meetingDetailPathFromParts('plenary', 'plenary-45')).toBe('/meetings/45/')
  })
  it('non-plenary sources fall back to the list filter path', () => {
    expect(meetingDetailPathFromParts('ballots', 'ballots-2026')).toBe('/resolutions/?meeting=ballots/ballots-2026')
  })
})

describe('standardUrn / projectUrn / memberUrn', () => {
  it('each kind composes under the shared base', () => {
    expect(standardUrn('iso-8601')).toBe('urn:iso:tc:154:standard:iso-8601')
    expect(projectUrn('iso-8601-amd')).toBe('urn:iso:tc:154:project:iso-8601-amd')
    expect(memberUrn('pan-wei')).toBe('urn:iso:tc:154:member:pan-wei')
  })
})

describe('parseMeetingParam', () => {
  it('splits type/file pairs', () => {
    expect(parseMeetingParam('plenary/plenary-31')).toEqual({ sourceType: 'plenary', sourceFile: 'plenary-31' })
  })
  it('rejects malformed params', () => {
    expect(parseMeetingParam(null)).toBeNull()
    expect(parseMeetingParam('')).toBeNull()
    expect(parseMeetingParam('plenary')).toBeNull()
    expect(parseMeetingParam('plenary/plenary-31/x')).toBeNull()
    expect(parseMeetingParam('/plenary-31')).toBeNull()
  })
})
