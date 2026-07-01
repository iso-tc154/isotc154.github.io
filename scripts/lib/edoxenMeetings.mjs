// SPDX-License-Identifier: MIT
//
// Edoxen Meeting format loader for isotc154. Loads YAML files produced
// in the canonical Edoxen Meeting shape (one Meeting per file, or a
// MeetingCollection document). Detection: top-level `identifier: [{...}]`
// is the signature; legacy files start with `title` and `ordinal`.
//
// The loader is a thin adapter — it does not own any normalization
// logic. It produces a Meeting object whose fields match the
// `lodash.set`-compatible dotted accessor convention used elsewhere in
// isotc154 (e.g. meeting.title, meeting.venues[0].name).
//
// Reference: https://github.com/edoxen/edoxen-model/models/meeting.lutaml
// Format:  https://github.com/edoxen/edoxen-schema/meeting.yaml

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

function coerceItem(row, fields) {
  if (!row) return row
  for (const f of fields) {
    if (f in row) row[f] = isoDate(row[f])
  }
  return row
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

function mapVenues(rawVenues) {
  if (!Array.isArray(rawVenues)) return []
  return rawVenues
    .filter((v) => v && v.name)
    .map((v) => ({
      name: v.name,
      address: v.address || '',
      link: v.link || '',
      phone: v.phone || '',
      note: v.note || '',
      lat: typeof v.lat === 'number' ? v.lat : null,
      lon: typeof v.lon === 'number' ? v.lon : null,
    }))
}

function scheduleItemOrNull(s) {
  if (!s) return null
  return {
    date: isoDate(s.date),
    time: s.time || '',
    event: s.event || '',
    description: s.description || '',
    room: s.room || '',
  }
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

function mapAgenda(rawAgenda) {
  if (!rawAgenda) return null
  return {
    source_doc: rawAgenda.source_doc || null,
    structure: null,
    opening_session: scheduleItemOrNull(rawAgenda.opening_session),
    closing_session: scheduleItemOrNull(rawAgenda.closing_session),
    wg_meetings: { dates: [], note: null },
    items: Array.isArray(rawAgenda.items)
      ? rawAgenda.items.map((it) => ({
          label: it.label || '',
          kind: it.kind || 'numbered',
          title: it.title || '',
          description: it.description || '',
          references: Array.isArray(it.references) ? it.references : [],
          outcome: it.outcome || null,
          resolution_ref: it.resolution_ref || null,
        }))
      : [],
  }
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

  const out = {
    title: localization?.title || '',
    ordinal,
    status: mapStatus(raw.status),
    year: Number(raw.year) || (from ? Number(from.slice(0, 4)) : null),
    landing_url: raw.landing_url || '',
    registration_url: raw.registration_url || '',
    time: { from: { date: from }, to: { date: to } },
    general_area: localization?.general_area || raw.general_area || '',
    country_code: raw.country_code || '',
    hosts: mapHosts(raw.hosts, raw.host),
    associates: [],
    secretary: presentPerson(raw.secretary),
    chair: presentPerson(raw.chair),
    local_contact: null,
    venues: mapVenues(raw.venues),
    reference_documents: [],
    agenda: mapAgenda(raw.agenda),
    schedule: mapSchedule(raw.schedule),
    deadlines: mapDeadlines(raw.deadlines),
    practical_info: localization?.practical_info || null,
    identifier: identifiers,
    urn: raw.urn || null,
    type: raw.type || null,
    committee: raw.committee || null,
    relations: raw.relations || [],
    resolution_refs: raw.resolution_refs || [],
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
