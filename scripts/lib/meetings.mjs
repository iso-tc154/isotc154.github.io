import fs from 'node:fs'
import path from 'node:path'
import yaml from 'js-yaml'

/**
 * Canonical meetings: the xlsx-derived list of every TC 154 plenary.
 * Cross-referenced with rich per-meeting YAMLs (venue, schedule, etc.)
 * and with resolution-derived meeting records (resolution count, URN).
 */

const TYPE_LABELS = {
  'face-to-face': 'In person',
  hybrid: 'Hybrid',
  virtual: 'Virtual',
}

const STATUS_LABELS = {
  closed: 'Concluded',
  cancelled: 'Cancelled',
  'registration-open': 'Registration open',
  confirmed: 'Confirmed',
  tentative: 'Tentative',
  scheduled: 'Scheduled',
}

function labelOf(map, value) {
  if (!value) return ''
  return map[value] || value
}

/**
 * Parse a local datetime string like "31 Aug 2026 00:00 CEST"
 * into { year, monthName, day, time, tzAbbrev, sortable }.
 * Returns null when unparseable. Does NOT convert timezones.
 */
function parseLocalDateTime(s) {
  if (!s) return null
  const m = s.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})\s+(\d{1,2}:\d{2})(?:\s+([A-Z]+))?$/)
  if (!m) return null
  const [, day, monthName, year, time, tz] = m
  const monthNum = {
    Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
    Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
  }[monthName]
  if (!monthNum) return null
  return {
    year: parseInt(year, 10),
    monthName,
    monthNum,
    day: parseInt(day, 10),
    time,
    tz: tz || '',
    isMidnight: time === '00:00',
    isEndOfDay: time === '23:59',
    sortable: `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')} ${time}`,
  }
}

function shortDate(parsed) {
  if (!parsed) return ''
  return `${parsed.day} ${parsed.monthName} ${parsed.year}`
}

function dayMonth(parsed) {
  if (!parsed) return ''
  return `${parsed.day} ${parsed.monthName}`
}

function longDate(parsed) {
  if (!parsed) return ''
  const monthFull = {
    Jan: 'January', Feb: 'February', Mar: 'March', Apr: 'April',
    May: 'May', Jun: 'June', Jul: 'July', Aug: 'August',
    Sep: 'September', Oct: 'October', Nov: 'November', Dec: 'December',
  }[parsed.monthName] || parsed.monthName
  return `${monthFull} ${parsed.day}, ${parsed.year}`
}

function meetingDateRange(session) {
  const from = parseLocalDateTime(session.start_date)
  const to = parseLocalDateTime(session.end_date)
  if (!from && !to) return ''
  // Full-day events: xlsx export uses 00:00 / 23:59 as day boundaries, not real times.
  const fullDay = from && to && from.isMidnight && to.isEndOfDay
  if (from && to && from.year === to.year && from.monthNum === to.monthNum && from.day === to.day) {
    if (fullDay) return longDate(from)
    return `${longDate(from)} · ${from.time}–${to.time}${to.tz ? ' ' + to.tz : ''}`
  }
  if (from && to && from.year === to.year) {
    return `${dayMonth(from)} – ${dayMonth(to)}, ${to.year}`
  }
  if (from && to) {
    return `${shortDate(from)} – ${shortDate(to)}`
  }
  if (from) return longDate(from)
  return longDate(to)
}

function meetingLocation(session) {
  const parts = []
  // The export's "City" column often contains a venue/address fragment,
  // so treat it as the place label, not just a city name.
  if (session.city) parts.push(session.city.replace(/[,;]\s*$/, ''))
  if (session.country && session.country !== session.city) {
    parts.push(session.country)
  }
  if (session.virtual_address && session.virtual_address.toLowerCase() !== 'zoom') {
    parts.push(`Online · ${session.virtual_address}`)
  }
  return parts.filter(Boolean).join(' · ')
}

function statusLabelFor(sessions) {
  // The most informative status across sessions.
  if (!sessions.length) return ''
  // cancelled dominates
  if (sessions.some(s => s.status === 'cancelled')) return 'Cancelled'
  // registration-open / upcoming dominates
  const live = sessions.find(s => s.status === 'registration-open' || s.status === 'confirmed' || s.status === 'scheduled')
  if (live) return labelOf(STATUS_LABELS, live.status)
  // otherwise take primary
  return labelOf(STATUS_LABELS, sessions[0].status)
}

function typeLabelFor(sessions) {
  // If any session is hybrid, the meeting is hybrid. Otherwise primary's type.
  if (sessions.some(s => s.type === 'hybrid')) return 'Hybrid'
  if (sessions.every(s => s.type === 'virtual')) return 'Virtual'
  if (sessions.every(s => s.type === 'face-to-face')) return 'In person'
  return labelOf(TYPE_LABELS, sessions[0]?.type)
}

function participantTotal(sessions) {
  const n = sessions.reduce((acc, s) => acc + (s.participants || 0), 0)
  return n > 0 ? n : null
}

function sanitizeRich(rich, orgIndex) {
  if (!rich) return undefined
  const { landing_url, hosts: rawHosts, host: legacyHost, associates: rawAssociates, ...rest } = rich
  const out = { ...rest }
  out.hosts = resolveHosts(rawHosts, legacyHost, orgIndex)
  out.associates = resolveAssociates(rawAssociates, orgIndex)
  return out
}

function fallbackNameFromRef(ref) {
  if (!ref) return null
  // Acronyms (2-5 lowercase letters) → uppercase
  if (/^[a-z]{2,5}$/.test(ref)) return ref.toUpperCase()
  // snake/kebab-case → title case with spaces
  return ref
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function resolveHosts(rawHosts, legacyHost, orgIndex) {
  if (!orgIndex) return []
  const out = []
  if (Array.isArray(rawHosts)) {
    for (const h of rawHosts) {
      if (!h) continue
      if (typeof h === 'string') {
        const r = orgIndex.lookupAny(h, ['national-body', 'liaison'])
        if (r) out.push(r); else out.push({ name: h, kind: 'unknown' })
        continue
      }
      if (h.ref) {
        const r = orgIndex.lookupAny(h.ref, ['national-body', 'liaison'])
        if (r) {
          // Preserve any contact info from the YAML entry
          if (h.contact) r.contact = h.contact
          out.push(r); continue
        }
      }
      const fallbackName = h.name || fallbackNameFromRef(h.ref)
      if (fallbackName) {
        out.push({
          ref: h.ref,
          type: h.type,
          name: fallbackName,
          url: h.url,
          contact: h.contact,
          kind: 'unknown',
        })
      }
    }
  } else if (legacyHost && typeof legacyHost === 'string') {
    // Legacy: try the whole string first, then fall back to splitting on /
    const direct = orgIndex.lookupAny(legacyHost, ['national-body', 'liaison'])
    if (direct) {
      out.push(direct)
    } else {
      const tokens = legacyHost.split(/\s*\/\s*/).map(t => t.trim()).filter(Boolean)
      for (const t of tokens) {
        const r = orgIndex.lookupAny(t, ['national-body', 'liaison'])
        if (r) out.push(r); else out.push({ name: t, kind: 'unknown' })
      }
    }
  }
  return out
}

function resolveAssociates(rawAssociates, orgIndex) {
  if (!orgIndex || !Array.isArray(rawAssociates)) return []
  const out = []
  for (const a of rawAssociates) {
    if (!a) continue
    if (typeof a === 'string') {
      const r = orgIndex.lookupAny(a)
      if (r) out.push({ ...r, role: a.role })
      else out.push({ name: a, kind: 'inline' })
      continue
    }
    // Resolve by ref against any tier (NB, liaison, or associate)
    if (a.ref) {
      const r = orgIndex.lookupAny(a.ref)
      if (r) {
        out.push({
          ...r,
          role: a.role,
          parent_ref: a.parent_ref,
          contact: a.contact,
        })
        continue
      }
    }
    // Inline entry
    out.push({
      ref: a.ref,
      name: a.name || fallbackNameFromRef(a.ref),
      url: a.url,
      country: a.country,
      category: a.category,
      role: a.role,
      parent_ref: a.parent_ref,
      contact: a.contact,
      kind: 'inline',
    })
  }
  return out
}

export function loadCanonicalMeetings(meetingsYmlPath, eventsDir, resolutionMeetings, orgIndex) {
  if (!fs.existsSync(meetingsYmlPath)) {
    console.warn(`[meetings] canonical list not found: ${meetingsYmlPath}`)
    return []
  }

  const raw = yaml.load(fs.readFileSync(meetingsYmlPath, 'utf8')) || []

  // Index rich event data by ordinal
  const richByOrdinal = new Map()
  if (eventsDir && fs.existsSync(eventsDir)) {
    for (const file of fs.readdirSync(eventsDir)) {
      const m = file.match(/^plenary-meeting-(\d+)\.ya?ml$/)
      if (!m) continue
      const ordinal = parseInt(m[1], 10)
      const data = yaml.load(fs.readFileSync(path.join(eventsDir, file), 'utf8'))
      if (data) richByOrdinal.set(ordinal, data)
    }
  }

  // Index resolution meetings by ordinal derived from source_file
  const resByOrdinal = new Map()
  for (const rm of resolutionMeetings || []) {
    const m = rm.source_file && rm.source_file.match(/^plenary-(\d+)/)
    if (!m) continue
    const ordinal = parseInt(m[1], 10)
    // Prefer the highest-resolution record
    if (!resByOrdinal.has(ordinal) || (rm.resolution_count || 0) > (resByOrdinal.get(ordinal).resolution_count || 0)) {
      resByOrdinal.set(ordinal, rm)
    }
  }

  // Group raw sessions by ordinal. A single plenary may have multiple sessions
  // (e.g., the 39th and 40th had separate virtual sub-meetings during COVID).
  const sessionsByOrdinal = new Map()
  for (const session of raw) {
    const ordinal = session.ordinal
    if (!sessionsByOrdinal.has(ordinal)) sessionsByOrdinal.set(ordinal, [])
    sessionsByOrdinal.get(ordinal).push(session)
  }

  const meetings = []
  for (const [ordinal, sessions] of sessionsByOrdinal) {
    // Sort sessions within a meeting by start_date ascending
    sessions.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''))

    // Pick the primary session: the one without a parent, or the earliest
    const primary = sessions.find(s => !s.parent_iso_meeting_id) || sessions[0]

    // Year derived from primary session start_date
    const parsedStart = parseLocalDateTime(primary.start_date)
    const year = parsedStart ? parsedStart.year : null

    const res = resByOrdinal.get(ordinal)
    const rich = richByOrdinal.get(ordinal)

    const meeting = {
      ordinal,
      year,
      url: `/meetings/${ordinal}/`,
      sessions: sessions.map(s => ({
        iso_meeting_id: s.iso_meeting_id ?? null,
        type: s.type,
        status: s.status,
        start_date: s.start_date,
        end_date: s.end_date,
        country: s.country ?? null,
        city: s.city ?? null,
        address: s.address ?? null,
        virtual_address: s.virtual_address ?? null,
        participants: s.participants ?? null,
        iso_meeting_url: s.iso_meeting_url ?? null,
        cancellation_comment: s.cancellation_comment ?? null,
        reschedule_note: s.reschedule_note ?? null,
        reschedule_timeframe: s.reschedule_timeframe ?? null,
        parent_iso_meeting_id: s.parent_iso_meeting_id ?? null,
      })),
      primary,
      status_label: statusLabelFor(sessions),
      type_label: typeLabelFor(sessions),
      location_label: meetingLocation(primary),
      date_label: meetingDateRange(primary),
      participant_total: participantTotal(sessions),
      resolution_count: res?.resolution_count || 0,
      acclamation_count: res?.acclamation_count || 0,
      resolutions_url: res?.path || null,
      resolutions_meeting_urn: res?.meeting_urn || null,
      rich: sanitizeRich(rich, orgIndex),
    }
    meetings.push(meeting)
  }

  // Sort newest ordinal first
  meetings.sort((a, b) => b.ordinal - a.ordinal)

  return meetings
}
