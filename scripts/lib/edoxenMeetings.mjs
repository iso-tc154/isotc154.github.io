// SPDX-License-Identifier: MIT
//
// Edoxen Meeting format loader for isotc154. Loads YAML files produced
// in the canonical Edoxen v2.1 Meeting shape (one Meeting per file, or a
// MeetingCollection document). Detection: top-level `identifier: [{...}]`
// + `type:` is the signature; legacy files start with `title` and `ordinal`.
//
// v2.1 changes handled here (vs the prior v0.7.x loader):
//   - chair/secretary → officers[] (role-discriminated)
//   - venues[] flat Venue (kind, name, address, unlocode, url — not link)
//   - year removed (derived from date_range.start)
//   - resolution_refs → decisions (inline Decision refs, not bare strings)
//   - agenda.opening_session/closing_session → components[] (MeetingComponent)
//   - agenda.items[].resolution_ref → decision_ref
//
// The loader is a thin adapter — it does not own any normalization
// logic. It produces a Meeting object whose fields match the
// `lodash.set`-compatible dotted accessor convention used elsewhere in
// isotc154 (e.g. meeting.title, meeting.venues[0].name).

import fs from 'node:fs'
import path from 'node:path'

import { loadYamlFile, loadYamlDir } from './yamlDir.mjs'

const EDOXEN_SIGNATURE = ['identifier', 'type']

export function isEdoxenMeetingShape(parsed) {
  if (!parsed || typeof parsed !== 'object') return null
  return EDOXEN_SIGNATURE.every((k) => Object.prototype.hasOwnProperty.call(parsed, k))
}

function isoDate(v) {
  if (v == null) return ''
  if (v instanceof Date) return v.toISOString().slice(0, 10)
  return String(v)
}

function pickLocalization(list) {
  if (!Array.isArray(list) || list.length === 0) return null
  return list.find((l) => l.language_code === 'eng') || list[0]
}

function mapStatus(s) {
  if (!s) return 'scheduled'
  const t = String(s).toLowerCase()
  if (t === 'completed') return 'closed'
  if (t === 'upcoming') return 'registration-open'
  if (t === 'cancelled') return 'cancelled'
  return t
}

function mapHosts(rawHosts, legacyHost) {
  const out = []
  if (Array.isArray(rawHosts)) {
    for (const h of rawHosts) {
      if (!h) continue
      out.push({
        ref: h.ref || null,
        type: h.type || null,
        role: h.role || null,
        name: h.contact?.name || null,
      })
    }
  }
  if (out.length === 0 && typeof legacyHost === 'string' && legacyHost) {
    out.push({ ref: null, type: null, role: null, name: legacyHost })
  }
  return out
}

function presentPerson(p) {
  if (!p) return null
  return {
    name: p.name || '',
    organization: p.affiliation || p.organization || '',
    email: p.email || '',
    phone: p.phone || '',
  }
}

// v2.1: extract chair and secretary from officers[] (role-discriminated).
// Falls back to legacy direct shortcuts for v0.7.x compat.
function extractOfficer(raw, role) {
  // v2.1: officers[]
  if (Array.isArray(raw.officers)) {
    const officer = raw.officers.find((o) => o.role === role)
    if (officer?.person) return presentPerson(officer.person)
  }
  // v0.7.x fallback: direct shortcut (raw.chair / raw.secretary)
  if (raw[role]) return presentPerson(raw[role])
  return null
}

// v2.1: flat Venue — kind discriminates physical/virtual. Fields:
// name, address, unlocode, country_code, url (not link), lat, lon.
// Falls back to v0.7.x `link` field for compat.
function mapVenues(rawVenues) {
  if (!Array.isArray(rawVenues)) return []
  return rawVenues
    .filter((v) => v && v.name)
    .map((v) => ({
      name: v.name,
      address: v.address || '',
      // v2.1 uses `url`; v0.7.x used `link`. Accept either.
      link: v.url || v.link || '',
      phone: v.phone || '',
      note: v.note || v.access_notes || '',
      lat: typeof v.lat === 'number' ? v.lat : null,
      lon: typeof v.lon === 'number' ? v.lon : null,
    }))
}

function mapSchedule(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((r) => ({
    date: isoDate(r.date),
    time: r.time || '',
    event: r.event || '',
    description: r.description || '',
    room: r.room || '',
  }))
}

function mapDeadlines(rows) {
  if (!Array.isArray(rows)) return []
  return rows.map((d) => ({
    date: isoDate(d.date),
    description: d.description || '',
  }))
}

// v2.1: agenda no longer has opening_session/closing_session (those are
// MeetingComponents). Items use decision_ref (not resolution_ref).
function mapAgenda(rawAgenda) {
  if (!rawAgenda) return null
  return {
    source_doc: rawAgenda.source_doc || null,
    structure: null,
    opening_session: null,
    closing_session: null,
    wg_meetings: { dates: [], note: null },
    items: Array.isArray(rawAgenda.items)
      ? rawAgenda.items.map((it) => ({
          label: it.label || '',
          kind: it.kind || 'numbered',
          title: it.title || '',
          description: it.description || '',
          references: Array.isArray(it.references) ? it.references : [],
          outcome: it.outcome || null,
          // v2.1: decision_ref (was resolution_ref in v0.7.x)
          decision_ref: it.decision_ref || it.resolution_ref || null,
        }))
      : [],
  }
}

// v2.1: components[] are flat sub-events (MeetingComponent). Project
// opening/closing back into the legacy schedule shape so the site's
// calendar component can render them.
function componentsToSchedule(rawComponents) {
  if (!Array.isArray(rawComponents)) return []
  return rawComponents
    .filter((c) => c && c.starts_at)
    .map((c) => ({
      date: isoDate(c.starts_at),
      time: '',
      event: c.title || c.kind || '',
      description: c.description || '',
      room: '',
    }))
}

function normalizeMeeting(raw) {
  if (!raw || !raw.identifier) return null
  const identifiers = Array.isArray(raw.identifier) ? raw.identifier : [raw.identifier]
  if (identifiers.length === 0) return null

  const primary = identifiers[0] || {}
  const ordinal = Number.isFinite(Number(raw.ordinal))
    ? Number(raw.ordinal)
    : Number(primary.number || 0)

  const localization = pickLocalization(raw.localizations)

  const from = isoDate(raw.date_range?.start)
  const to = isoDate(raw.date_range?.end)

  // v2.1: year is derived from date_range.start (field removed).
  const year = Number(raw.year) || (from ? Number(from.slice(0, 4)) : null)

  // v2.1: schedule can come from the site-specific `schedule:` array
  // OR from v2.1 `components[]` (MeetingComponent). Prefer the
  // site-specific schedule if present; fall back to components.
  const scheduleRows = mapSchedule(raw.schedule)
  const componentSchedule = componentsToSchedule(raw.components)
  const schedule = scheduleRows.length > 0 ? scheduleRows : componentSchedule

  const out = {
    title: localization?.title || '',
    ordinal,
    status: mapStatus(raw.status),
    year,
    landing_url: raw.landing_url || '',
    registration_url: raw.registration_url || '',
    time: { from: { date: from }, to: { date: to } },
    general_area: localization?.general_area || raw.general_area || '',
    country_code: raw.country_code || '',
    hosts: mapHosts(raw.hosts, raw.host),
    associates: [],
    // v2.1: read from officers[] (role-discriminated); fall back to
    // legacy direct shortcuts for v0.7.x compat.
    secretary: extractOfficer(raw, 'secretary'),
    chair: extractOfficer(raw, 'chair'),
    local_contact: null,
    venues: mapVenues(raw.venues),
    reference_documents: [],
    agenda: mapAgenda(raw.agenda),
    schedule,
    deadlines: mapDeadlines(raw.deadlines),
    practical_info: localization?.practical_info || null,
    identifier: identifiers,
    urn: raw.urn || null,
    type: raw.type || null,
    committee: raw.committee || null,
    relations: raw.relations || [],
    // v2.1: decisions (was resolution_refs in v0.7.x). Accept either.
    resolution_refs: raw.decisions || raw.resolution_refs || [],
    _edoxen: { raw, localization },
  }
  return out
}

export function loadEdoxenMeetingFile(filePath) {
  let parsed
  try {
    parsed = loadYamlFile(filePath)
  } catch (e) {
    return null
  }
  if (!isEdoxenMeetingShape(parsed)) return null

  if (Array.isArray(parsed.meetings)) {
    const meetings = parsed.meetings.map(normalizeMeeting).filter(Boolean)
    return { shape: 'collection', metadata: parsed.metadata || {}, meetings }
  }

  const normalized = normalizeMeeting(parsed)
  if (!normalized) return null
  return { shape: 'single', metadata: {}, meetings: [normalized] }
}

export function loadEdoxenMeetingsDir(eventsDir) {
  if (!eventsDir || !fs.existsSync(eventsDir)) {
    return { shape: 'dir', dir: eventsDir, meetings: [], metadata: {} }
  }
  const all = loadYamlDir(eventsDir, {
    predicate: (data) => isEdoxenMeetingShape(data),
    transform: (data) => {
      if (Array.isArray(data.meetings)) {
        return data.meetings.map((m) => normalizeMeeting(m)).filter(Boolean)
      }
      const norm = normalizeMeeting(data)
      return norm ? [norm] : []
    },
  })
  return { shape: 'dir', dir: eventsDir, meetings: all.flat(), metadata: {} }
}
