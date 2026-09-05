import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'
import { ordinalText } from '../src/utils/ordinal.ts'

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

const toISODate = (value) => {
  if (!value) return null
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

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
    const doc = loadYaml(path.join(RESOLUTIONS_DIR, f))
    const refs = (doc?.decisions ?? [])
      .map((d) => d.identifier?.[0])
      .filter((i) => i?.prefix && i?.number != null)
      .map((i) => ({ prefix: i.prefix, number: String(i.number) }))
    if (refs.length) decisionsByPlenary.set(ordinal, refs)
  }
}

// The xlsx export carries one row per ISO session; plenaries 39–41 held
// several sessions under one ordinal. Group rows by ordinal so each
// plenary becomes exactly one doc spanning all of its sessions.
const byOrdinal = new Map()
for (const row of canonical) {
  if (row.ordinal == null) continue
  if (!byOrdinal.has(row.ordinal)) byOrdinal.set(row.ordinal, [])
  byOrdinal.get(row.ordinal).push(row)
}

fs.rmSync(OUT, { recursive: true, force: true })
fs.mkdirSync(OUT, { recursive: true })

const today = new Date().toISOString().slice(0, 10)

let count = 0
for (const [ordinal, rows] of byOrdinal) {
  const rich = richByOrdinal.get(ordinal) ?? {}
  const sd = seed[String(ordinal)] ?? {}

  const landingUrls = [...new Set(
    rows.map((r) => r.iso_meeting_url)
      .filter((u) => typeof u === 'string' && /^https?:\/\//.test(u)),
  )]

  const xlsxStarts = rows.map((r) => parseXlsxDate(r.start_date)).filter(Boolean).sort()
  const xlsxEnds = rows.map((r) => parseXlsxDate(r.end_date)).filter(Boolean).sort()
  // Rich event dates win when curated; otherwise span the full xlsx window.
  const start = toISODate(rich.time?.from?.date) ?? xlsxStarts[0] ?? null
  const end = toISODate(rich.time?.to?.date) ?? xlsxEnds[xlsxEnds.length - 1] ?? start

  const anchor = end ?? start
  const cancelled = rows.some((r) => r.status === 'cancelled')
  const status = cancelled ? 'cancelled' : anchor && anchor < today ? 'completed' : 'upcoming'

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
  if (landingUrls.length) {
    doc.source_urls = landingUrls.map((ref) => ({ ref, kind: 'landing_page' }))
  }
  if (start || end) {
    doc.scheduled_date_range = { start: start ?? end, end: end ?? start }
  }
  // Pass through curated rich fields, wrapped into the localized shapes
  // the edoxen model expects (plain strings in events/ become
  // [{spelling, value}]). Seed extras (hand-doc-only fields, e.g.
  // plenary 42's components/officers/landing_url) override verbatim.
  const localized = (v) => (typeof v === 'string' ? [{ spelling: 'eng', value: v }] : v)
  if (rich.general_area != null) doc.general_area = localized(rich.general_area)
  if (rich.note != null && !sd.extras?.note) doc.note = localized(rich.note)
  if (rich.hosts != null) {
    // The edoxen Host shape requires a ref and a closed type set
    // (national_body, liaison, ...). Rich events use hyphenated and
    // free-form types; free-form hosts are dropped rather than
    // misclassified.
    const TYPE_MAP = { 'national-body': 'national_body', national_body: 'national_body', liaison: 'liaison' }
    const hosts = rich.hosts
      .filter((h) => h && (h.ref || h.name) && TYPE_MAP[h.type])
      .map((h) => ({
        ref: h.ref ?? String(h.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        type: TYPE_MAP[h.type],
        ...(h.role ? { role: h.role } : {}),
      }))
    if (hosts.length) doc.hosts = hosts
  }
  if (rich.deadlines != null) {
    // Date-less rich entries are standing instructions, not deadlines;
    // the edoxen deadline shape requires a date.
    const deadlines = rich.deadlines
      .filter((d) => d && d.date != null)
      .map((d) => ({ date: toISODate(d.date) ?? d.date, description: localized(d.description) }))
    if (deadlines.length) doc.deadlines = deadlines
  }
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

function parseXlsxDate(raw) {
  if (!raw) return null
  const m = String(raw).match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/)
  if (!m) return null
  const months = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' }
  return months[m[2]] ? `${m[3]}-${months[m[2]]}-${m[1].padStart(2, '0')}` : null
}

// js-yaml renders JS Dates as timestamps; the edoxen schema wants plain
// YYYY-MM-DD strings. Walk the doc and convert every Date.
function deepISOStrings(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (Array.isArray(value)) return value.map(deepISOStrings)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepISOStrings(v)]))
  }
  return value
}
