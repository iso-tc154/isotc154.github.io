// Pure-function specs with inline fixtures — these always run, unlike
// edoxen-doc.load.spec.ts which is gated on the staged submodule.
import { describe, it, expect } from 'vitest'
import { resolutionCards, decisionRedirects } from './edoxen-doc'

const doc = {
  decisions: [
    {
      urn: 'urn:iso-tc154:resolution:plenary-44:2023-01',
      kind: 'resolution',
      status: 'approved',
      identifier: [{ number: '2023-01' }],
      title: [{ value: 'Thanks' }],
      subject: [{ value: 'Appreciation' }],
      actions: [{ message: [{ value: 'Resolve' }] }],
    },
    {
      urn: 'urn:iso-tc154:resolution:plenary-44:2023-02-acclaim-1',
      kind: 'acclamation',
      identifier: [{ number: '2023-02-acclaim-1' }],
    },
    { identifier: [{ number: '2023-03' }] }, // no urn: skipped by redirects, still carded
  ],
}

describe('resolutionCards', () => {
  it('flattens localized arrays and derives ids from the URN tail', () => {
    const cards = resolutionCards(doc)
    expect(cards).toHaveLength(3)
    expect(cards[0]).toEqual({
      id: '2023-01',
      urn: 'urn:iso-tc154:resolution:plenary-44:2023-01',
      title: 'Thanks',
      subject: 'Appreciation',
      kind: 'resolution',
      isAcclamation: false,
    })
  })
  it('flags acclamation by kind OR acclaimed status; defaults kind to resolution', () => {
    const cards = resolutionCards(doc)
    expect(cards[1].isAcclamation).toBe(true)
    expect(cards[1].kind).toBe('acclamation')
    expect(cards[2].kind).toBe('resolution')
    expect(resolutionCards({ decisions: [{ urn: 'u', status: 'acclaimed' }] })[0].isAcclamation).toBe(true)
  })
  it('missing fields degrade to empty strings, never undefined', () => {
    const c = resolutionCards({ decisions: [{}] })[0]
    expect(c).toEqual({ id: '', urn: '', title: '', subject: '', kind: 'resolution', isAcclamation: false })
  })
  it('empty/absent decisions yield an empty array', () => {
    expect(resolutionCards({})).toEqual([])
    expect(resolutionCards({ decisions: [] })).toEqual([])
  })
})

describe('decisionRedirects', () => {
  it('maps legacy /resolutions/{sub}/{file}/{number} to /decisions/{urn}/', () => {
    expect(decisionRedirects(doc, 'plenary', 'plenary-44')).toEqual({
      '/resolutions/plenary/plenary-44/2023-01': '/decisions/urn:iso-tc154:resolution:plenary-44:2023-01/',
      '/resolutions/plenary/plenary-44/2023-02-acclaim-1': '/decisions/urn:iso-tc154:resolution:plenary-44:2023-02-acclaim-1/',
    })
  })
  it('skips decisions without a urn or identifier number', () => {
    expect(decisionRedirects({ decisions: [{ urn: 'u' }, { identifier: [{ number: 'n' }] }] }, 'plenary', 'f')).toEqual({})
  })
})
