import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { ordinalText } from '../src/utils/ordinal.ts'
import {
  toISODate, parseXlsxDate, groupRowsByOrdinal, deriveStatus, landingUrls,
  toEdoxenHosts, toEdoxenDeadlines, localize, deepISOStrings, decisionRefs,
} from './lib/edoxenEvents.mjs'

/**
 * Generate the edoxen event documents (_data/events-edoxen/*.yaml) from
 * the two meeting sources of truth:
 *
 *   data/meetings.yml            canonical xlsx-derived list (all plenaries)
 *   _data/events/plenary-*.yml   rich per-meeting content (recent plenaries)
 *
 * plus scripts/data/edoxen-meeting-seed.yml (venue facts for plenaries
 * with no rich file, extracted once from the retired hand-maintained
 * docs) and the staged resolutions (decision cross-references).
 *
 * The output directory is gitignored and regenerated on every build —
 * the meeting's edoxen representation is derived, never hand-edited.
 */

const ROOT = path.resolve(import.meta.dirname, '..')
const CANONICAL = path.join(ROOT, 'data/meetings.yml')
const EVENTS_DIR = path.join(ROOT, '_data/events')
const SEED = path.join(ROOT, 'scripts/data/edoxen-meeting-seed.yml')
const RESOLUTIONS_DIR = path.join(ROOT, '_data/resolutions-edoxen')
const OUT = path.join(ROOT, '_data/events-edoxen')

const loadYaml = (p) => (fs.existsSync(p) ? yaml.load(fs.readFileSync(p, 'utf8')) : null)

const canonical = loadYaml(CANONICAL) ?? []
const seed = loadYaml(SEED) ?? {}

const richByOrdinal = new Map()
for (const f of fs.readdirSync(EVENTS_DIR).filter((f) => /^plenary-meeting-\d+\.yml$/.test(f))) {
  const doc = loadYaml(path.join(EVENTS_DIR, f))
  if (doc?.ordinal) richByOrdinal.set(doc.ordinal, doc)
}

const decisionsByPlenary = new Map()
if (fs.existsSync(RESOLUTIONS_DIR)) {
  for (const f of fs.readdirSync(RESOLUTIONS_DIR).filter((f) => /^plenary-(\d+)\.yaml$/.test(f))) {
    const ordinal = parseInt(f.match(/^plenary-(\d+)\.yaml$/)[1], 10)
    const refs = decisionRefs(loadYaml(path.join(RESOLUTIONS_DIR, f)))
    if (refs.length) decisionsByPlenary.set(ordinal, refs)
  }
}

const byOrdinal = groupRowsByOrdinal(canonical)

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const today = new Date().toISOString().slice(0, 10)

let count = 0
for (const [ordinal, rows] of byOrdinal) {
  const rich = richByOrdinal.get(ordinal) ?? {}
  const sd = seed[String(ordinal)] ?? {}

  const urls = landingUrls(rows)

  const { start, end, status } = deriveStatus(rows, rich, today)

  const countryCode = sd.country_code ?? rich.country_code ?? null
  const unlocode = sd.unlocode ?? null
  // Seed venue wins: the curated short names and virtual kinds lived only
  // in the retired hand docs.
  const venueName = sd.venue_name ?? rich.venues?.[0]?.name ?? null
  const venueKind = sd.venue_kind ?? 'physical'

  const doc = {
    identifier: [{ prefix: 'ISO/TC 154', number: String(ordinal) }],
    urn: `urn:iso-tc154:meeting:plenary-${ordinal}`,
    type: 'plenary',
    status,
    ordinal,
    committee: {
      code: 'ISO/TC 154',
      name: [{ spelling: 'eng', value: 'ISO/TC 154' }],
    },
  }
  if (unlocode) doc.city = unlocode
  if (countryCode) doc.country_code = countryCode
  doc.title = [{ spelling: 'eng', value: `${ordinalText(ordinal)} plenary meeting of ISO/TC 154` }]
  if (venueName || venueKind === 'virtual') {
    const venue = { kind: venueKind, name: [{ spelling: 'eng', value: venueName ?? '' }] }
    if (countryCode) venue.country_code = countryCode
    if (unlocode) venue.unlocode = unlocode
    doc.venues = [venue]
  }
  if (urls.length) {
    doc.source_urls = urls.map((ref) => ({ ref, kind: 'landing_page' }))
  }
  if (start || end) {
    doc.scheduled_date_range = { start: start ?? end, end: end ?? start }
  }
  // Pass through curated rich fields, wrapped into the localized shapes
  // the edoxen model expects (plain strings in events/ become
  // [{spelling, value}]). Seed extras (hand-doc-only fields, e.g.
  // plenary 42's components/officers/landing_url) override verbatim.
  if (rich.general_area != null) doc.general_area = localize(rich.general_area)
  if (rich.note != null && !sd.extras?.note) doc.note = localize(rich.note)
  const hosts = toEdoxenHosts(rich.hosts)
  if (hosts) doc.hosts = hosts
  const deadlines = toEdoxenDeadlines(rich.deadlines)
  if (deadlines) doc.deadlines = deadlines
  if (sd.extras) {
    for (const [key, value] of Object.entries(sd.extras)) {
      if (value != null) doc[key] = value
    }
  }
  const decisionRefs = decisionsByPlenary.get(ordinal)
  if (decisionRefs) doc.decisions = decisionRefs

  const out = `---\n${yaml.dump(deepISOStrings(doc), { lineWidth: 100, noRefs: true })}`
  fs.writeFileSync(path.join(OUT, `plenary-meeting-${ordinal}.yaml`), out)
  count++
}

console.log(`[generate-edoxen-events] ${count} event docs → ${path.relative(ROOT, OUT)}`)

