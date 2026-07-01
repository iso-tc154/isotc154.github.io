// SPDX-License-Identifier: MIT
//
// Edoxen Meeting format loader for isotc154. Loads YAML files in the
// canonical Edoxen v2.2 Meeting shape (one Meeting per file, or a
// MeetingCollection document). Detection: top-level `identifier:
// [{...}]` + `type:` is the signature.
//
// No back-compat. Fixtures that don't conform to v2.2 are rejected by
// `edoxen validate-meetings` at the data layer; this loader assumes
// clean input.
//
// The loader is a thin adapter — it produces a Meeting object whose
// fields match the dotted-accessor convention used elsewhere in
// isotc154 (e.g. meeting.title, meeting.venues[0].name).

import fs from 'node:fs'
import path from 'node:path'

import { loadYamlFile, loadYamlDir } from './yamlDir.mjs'

const EDOXEN_SIGNATURE = ['identifier', 'type']

export function isEdoxenMeetingShape(parsed) {
  if (!parsed || typeof parsed !== 'object') return false
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

// v2.2 Name: prefer `formatted`; otherwise build from structured
// components. Returns '' for null/empty.
function displayName(name) {
  if (!name) return ''
  if (name.formatted) return name.formatted
  return [name.prefix, name.given, name.additional, name.family, name.suffix]
    .filter((s) => s != null && String(s).trim() !== '')
    .join(' ')
}

function primaryContactMethod(methods, kind) {
  if (!Array.isArray(methods)) return ''
  const primary = methods.find((m) => m && m.kind === kind && m.primary) ||
                  methods.find((m) => m && m.kind === kind)
  return primary?.value || ''
}

// v2.2 Contact: pulls email/phone from contact_methods[]. `name` is a
// Name object. Used for both Person (officer) and Contact (meeting
// local-contact, host-ref contact).
function presentContact(c) {
  if (!c) return null
  return {
    name: displayName(c.name),
    organization: c.affiliation || '',
    email: primaryContactMethod(c.contact_methods, 'email'),
    phone: primaryContactMethod(c.contact_methods, 'phone'),
  }
}

function mapHosts(rawHosts) {
  if (!Array.isArray(rawHosts)) return []
  return rawHosts
    .filter((h) => h)
    .map((h) => ({
      ref: h.ref || null,
      type: h.type || null,
      role: h.role || null,
      name: h.contact ? displayName(h.contact.name) : null,
    }))
}

function extractOfficer(raw, role) {
  if (!Array.isArray(raw.officers)) return null
  const officer = raw.officers.find((o) => o.role === role)
  return officer?.person ? presentContact(officer.person) : null
}

function mapVenues(rawVenues) {
  if (!Array.isArray(rawVenues)) return []
  return rawVenues
    .filter((v) => v && v.name)
    .map((v) => ({
      name: v.name,
      address: v.address || '',
      link: v.url || '',
      phone: primaryContactMethod(v.contact_methods, 'phone'),
      note: v.access_notes || '',
      lat: typeof v.lat === 'number' ? v.lat : null,
      lon: typeof v.lon === 'number' ? v.lon : null,
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
    items: Array.isArray(rawAgenda.items)
      ? rawAgenda.items.map((it) => ({
          label: it.label || '',
          kind: it.kind || 'numbered',
          title: it.title || '',
          description: it.description || '',
          references: Array.isArray(it.references) ? it.references : [],
          outcome: it.outcome || null,
          decision_ref: it.decision_ref || null,
        }))
      : [],
  }
}

// v2.2: components[] (MeetingComponent) is the SSOT for sub-events
// (was the legacy `schedule:` array in v0.7.x). Project into the
// site's schedule shape for the calendar component.
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
  const year = from ? Number(from.slice(0, 4)) : null

  return {
    title: localization?.title || '',
    ordinal,
    status: mapStatus(raw.status),
    year,
    landing_url: raw.landing_url || '',
    registration_url: raw.registration_url || '',
    time: { from: { date: from }, to: { date: to } },
    general_area: localization?.general_area || raw.general_area || '',
    country_code: raw.country_code || '',
    hosts: mapHosts(raw.hosts),
    associates: [],
    secretary: extractOfficer(raw, 'secretary'),
    chair: extractOfficer(raw, 'chair'),
    local_contact: raw.contact ? presentContact(raw.contact) : null,
    venues: mapVenues(raw.venues),
    reference_documents: [],
    agenda: mapAgenda(raw.agenda),
    schedule: componentsToSchedule(raw.components),
    deadlines: mapDeadlines(raw.deadlines),
    practical_info: localization?.practical_info || null,
    identifier: identifiers,
    urn: raw.urn || null,
    type: raw.type || null,
    committee: raw.committee || null,
    relations: raw.relations || [],
    decisions: raw.decisions || [],
    _edoxen: { raw, localization },
  }
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
