import { describe, it, expect } from 'vitest'
import {
  practicalLabel,
  touristItems,
  practicalEntries,
  sectionEntries,
  isUrl,
  isEmail,
  rateLabel,
  isUpcoming,
  decadeOf,
  typeInitials,
  formatSessionDate,
  sessionLabel,
  sessionLocation,
  sessionVirtual,
  associateRoleLabel,
  venueMapUrl,
  venueEmbedSrc,
  parseLeadingSeq,
  cleanResponsible,
  flattenAgenda,
  normalizeAgendaDate,
  agendaDrawers,
} from './meeting'

describe('practicalLabel', () => {
  it('uses the override vocabulary where defined', () => {
    expect(practicalLabel('wifi')).toBe('Wi-Fi')
    expect(practicalLabel('eu_schengen')).toBe('EU Schengen')
    expect(practicalLabel('invitation_email')).toBe('Invitation email')
  })
  it('title-cases unknown snake_case keys', () => {
    expect(practicalLabel('parking_info')).toBe('Parking Info')
    expect(practicalLabel('dinner')).toBe('Dinner')
  })
})

describe('touristItems', () => {
  it('renders the canonical named-list schema', () => {
    const items = touristItems([
      { name: 'visitBerlin — official portal', link: 'https://www.visitberlin.de/en' },
      { name: 'IFA Berlin — trade fair', link: 'https://www.ifa-berlin.com/', notes: 'Runs 4–8 September 2026.' },
    ])
    expect(items).toEqual([
      { name: 'visitBerlin — official portal', link: 'https://www.visitberlin.de/en', notes: undefined },
      { name: 'IFA Berlin — trade fair', link: 'https://www.ifa-berlin.com/', notes: 'Runs 4–8 September 2026.' },
    ])
  })
  it('humanizes a legacy snake_case map so raw keys can never leak (regression)', () => {
    const items = touristItems({
      museums_url: 'https://www.museumsportal-berlin.de/',
      ifa_note: 'A big fair.',
    })
    expect(items.map((i) => i.name)).toEqual(['Museums Url', 'Ifa Note'])
    expect(items.every((i) => !/[_]/.test(i.name))).toBe(true)
    expect(items[0].link).toBe('https://www.museumsportal-berlin.de/')
    expect(items[1].notes).toBe('A big fair.')
  })
  it('drops empty entries and ignores garbage', () => {
    expect(touristItems(undefined)).toEqual([])
    expect(touristItems('nope')).toEqual([])
    expect(touristItems([{ name: '', link: '', notes: '' }])).toEqual([])
  })
})

describe('practicalEntries / sectionEntries', () => {
  it('filters null, empty string, and empty arrays', () => {
    const info = { a: 'x', b: null, c: '', d: [], e: false, g: ['y'] }
    expect(practicalEntries(info).map(([k]) => k)).toEqual(['a', 'e', 'g'])
  })
  it('sectionEntries also drops explicit false', () => {
    const section = { a: 'x', e: false, f: true }
    expect(sectionEntries(section).map(([k]) => k)).toEqual(['a', 'f'])
  })
})

describe('guards', () => {
  it('isUrl only accepts http(s) strings', () => {
    expect(isUrl('https://x.dev')).toBe(true)
    expect(isUrl('mailto:a@b.c')).toBe(false)
    expect(isUrl(42)).toBe(false)
  })
  it('isEmail requires a plausible address', () => {
    expect(isEmail('a@b.co')).toBe(true)
    expect(isEmail('nope')).toBe(false)
  })
  it('rateLabel title-cases rate keys', () => {
    expect(rateLabel('single_rate')).toBe('Single Rate')
  })
})

describe('meeting list facets', () => {
  it('isUpcoming excludes concluded and cancelled', () => {
    expect(isUpcoming({ status_label: 'Scheduled' })).toBe(true)
    expect(isUpcoming({ status_label: 'Concluded' })).toBe(false)
    expect(isUpcoming({ status_label: 'Cancelled' })).toBe(false)
    expect(isUpcoming({})).toBe(true)
  })
  it('decadeOf floors to the decade', () => {
    expect(decadeOf(1972)).toBe(1970)
    expect(decadeOf(2026)).toBe(2020)
    expect(decadeOf(undefined)).toBeNull()
  })
  it('typeInitials maps known labels and abbreviates the rest', () => {
    expect(typeInitials({ type_label: 'Hybrid' })).toBe('HYB')
    expect(typeInitials({ type_label: 'Virtual' })).toBe('VRT')
    expect(typeInitials({ type_label: 'In person' })).toBe('F2F')
    expect(typeInitials({ type_label: 'Special' })).toBe('SPE')
    expect(typeInitials({})).toBe('')
  })
})

describe('sessions', () => {
  it('formatSessionDate keeps date, time, and non-UTC zone', () => {
    expect(formatSessionDate('2 Sep 2026')).toBe('2 Sep 2026')
    expect(formatSessionDate('2 Sep 2026 09:30')).toBe('2 Sep 2026 09:30')
    expect(formatSessionDate('2 Sep 2026 09:30 CEST')).toBe('2 Sep 2026 09:30 CEST')
    expect(formatSessionDate('2 Sep 2026 09:30 UTC')).toBe('2 Sep 2026 09:30')
    expect(formatSessionDate('whenever')).toBe('whenever')
  })
  it('sessionLabel spans start to end', () => {
    expect(sessionLabel({ start_date: '1 Sep 2026', end_date: '4 Sep 2026' })).toBe('1 Sep 2026 – 4 Sep 2026')
    expect(sessionLabel({ start_date: '1 Sep 2026', end_date: '1 Sep 2026' })).toBe('1 Sep 2026')
  })
  it('sessionLocation joins city and country, trimming punctuation', () => {
    expect(sessionLocation({ city: 'Berlin,', country: 'Germany' })).toBe('Berlin · Germany')
    expect(sessionLocation({ city: 'Berlin' })).toBe('Berlin')
    expect(sessionLocation({})).toBe('')
  })
  it('sessionVirtual hides generic platform names', () => {
    expect(sessionVirtual({ virtual_address: 'Zoom' })).toBeNull()
    expect(sessionVirtual({ virtual_address: 'online' })).toBeNull()
    expect(sessionVirtual({ virtual_address: 'https://meet.example/x' })).toBe('https://meet.example/x')
    expect(sessionVirtual({})).toBeNull()
  })
})

describe('associateRoleLabel', () => {
  it('maps known associate roles', () => {
    expect(associateRoleLabel('co-host')).toBe('Co-host')
    expect(associateRoleLabel('cohost')).toBe('Co-host')
    expect(associateRoleLabel('co-organizer')).toBe('Co-organizer')
  })
  it('title-cases unknown roles', () => {
    expect(associateRoleLabel('logistics_partner')).toBe('Logistics Partner')
    expect(associateRoleLabel()).toBe('')
  })
})

describe('venue', () => {
  it('returns null without coordinates', () => {
    expect(venueMapUrl(undefined)).toBeNull()
    expect(venueMapUrl({ lat: 52.5 })).toBeNull()
    expect(venueEmbedSrc({})).toBeNull()
  })
  it('builds OSM links from coordinates', () => {
    expect(venueMapUrl({ lat: 52.5, lon: 13.4 })).toContain('mlat=52.5&mlon=13.4')
    expect(venueEmbedSrc({ lat: 52.5, lon: 13.4 })).toContain('openstreetmap.org/export/embed.html')
  })
})

describe('agenda flattening', () => {
  it('parseLeadingSeq extracts dotted sequences', () => {
    expect(parseLeadingSeq('3.2.1 Adoption of agenda')).toEqual({ seq: '3.2.1', title: 'Adoption of agenda' })
    expect(parseLeadingSeq('Welcome')).toEqual({ seq: '', title: 'Welcome' })
  })
  it('cleanResponsible turns underscores into spaces', () => {
    expect(cleanResponsible('WG5_Convenor')).toBe('WG5 Convenor')
    expect(cleanResponsible(undefined)).toBe('')
  })
  it('flattens nested subitems with depth and refs', () => {
    const rows = flattenAgenda([
      { number: 1, title: 'Opening', speaker: 'chair', n_doc: 'N1700', subitems: [
        { title: '2.1 Report', speaker: 'secretary' },
      ] },
      { title: '3.2.1 Adoption of agenda' },
    ])
    expect(rows).toEqual([
      { seq: '1', title: 'Opening', responsible: 'chair', ref: 'N1700', depth: 0 },
      { seq: '2.1', title: 'Report', responsible: 'secretary', ref: '', depth: 1 },
      { seq: '3.2.1', title: 'Adoption of agenda', responsible: '', ref: '', depth: 0 },
    ])
  })
  it('normalizeAgendaDate keeps the date part only', () => {
    expect(normalizeAgendaDate('2026-09-02T09:00:00Z')).toBe('2026-09-02')
    expect(normalizeAgendaDate('')).toBe('')
    expect(normalizeAgendaDate('TBA')).toBe('TBA')
  })
  it('agendaDrawers yields opening then closing sessions', () => {
    const drawers = agendaDrawers({
      opening_session: { date: '2026-09-01', items: [{ number: 1, title: 'Call to order' }] },
      closing_session: { date: '2026-09-04', note: 'Final', items: [] },
    })
    expect(drawers.map((d) => d.key)).toEqual(['opening', 'closing'])
    expect(drawers[0].rows[0].title).toBe('Call to order')
    expect(drawers[1].note).toBe('Final')
    expect(agendaDrawers(undefined)).toEqual([])
  })
})
