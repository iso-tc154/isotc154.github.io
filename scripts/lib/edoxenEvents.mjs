// Pure seams of the edoxen event-doc generator. The I/O shell
// (generate-edoxen-events.mjs) reads the sources and writes the YAML;
// everything derivable lives here so it can be spec'd.

const MONTHS = { Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06', Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12' }

export function toISODate(value) {
  if (!value) return null
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10)
  }
  const m = String(value).match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}

export function parseXlsxDate(raw) {
  if (!raw) return null
  const m = String(raw).match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})/)
  if (!m) return null
  return MONTHS[m[2]] ? `${m[3]}-${MONTHS[m[2]]}-${m[1].padStart(2, '0')}` : null
}

// The xlsx export carries one row per ISO session; plenaries 39-41 held
// several sessions under one ordinal. Group rows so each plenary becomes
// exactly one doc spanning all of its sessions.
export function groupRowsByOrdinal(rows) {
  const byOrdinal = new Map()
  for (const row of rows) {
    if (row.ordinal == null) continue
    if (!byOrdinal.has(row.ordinal)) byOrdinal.set(row.ordinal, [])
    byOrdinal.get(row.ordinal).push(row)
  }
  return byOrdinal
}

export function deriveStatus(rows, rich, today) {
  const xlsxStarts = rows.map((r) => parseXlsxDate(r.start_date)).filter(Boolean).sort()
  const xlsxEnds = rows.map((r) => parseXlsxDate(r.end_date)).filter(Boolean).sort()
  const start = toISODate(rich.time?.from?.date) ?? xlsxStarts[0] ?? null
  const end = toISODate(rich.time?.to?.date) ?? xlsxEnds[xlsxEnds.length - 1] ?? start
  const cancelled = rows.some((r) => r.status === 'cancelled')
  const anchor = end ?? start
  return {
    start,
    end,
    status: cancelled ? 'cancelled' : anchor && anchor < today ? 'completed' : 'upcoming',
  }
}

export function landingUrls(rows) {
  return [...new Set(
    rows.map((r) => r.iso_meeting_url)
      .filter((u) => typeof u === 'string' && /^https?:\/\//.test(u)),
  )]
}

// The edoxen Host shape requires a ref and a closed type set
// (national_body, liaison, ...). Rich events use hyphenated and
// free-form types; free-form hosts are dropped rather than
// misclassified.
const HOST_TYPE_MAP = { 'national-body': 'national_body', national_body: 'national_body', liaison: 'liaison' }

export function toEdoxenHosts(richHosts) {
  const hosts = (richHosts ?? [])
    .filter((h) => h && (h.ref || h.name) && HOST_TYPE_MAP[h.type])
    .map((h) => ({
      ref: h.ref ?? String(h.name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      type: HOST_TYPE_MAP[h.type],
      ...(h.role ? { role: h.role } : {}),
    }))
  return hosts.length ? hosts : null
}

export function toEdoxenDeadlines(richDeadlines) {
  const deadlines = (richDeadlines ?? [])
    .filter((d) => d && d.date != null)
    .map((d) => ({ date: toISODate(d.date) ?? d.date, description: localize(d.description) }))
  return deadlines.length ? deadlines : null
}

export function localize(value) {
  return typeof value === 'string' ? [{ spelling: 'eng', value }] : value
}

// js-yaml renders JS Dates as timestamps; the edoxen schema wants plain
// YYYY-MM-DD strings. Walk a doc and convert every Date.
export function deepISOStrings(value) {
  if (value instanceof Date) return value.toISOString().slice(0, 10)
  if (Array.isArray(value)) return value.map(deepISOStrings)
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deepISOStrings(v)]))
  }
  return value
}

export function decisionRefs(decisionDoc) {
  return (decisionDoc?.decisions ?? [])
    .map((d) => d.identifier?.[0])
    .filter((i) => i?.prefix && i?.number != null)
    .map((i) => ({ prefix: i.prefix, number: String(i.number) }))
}
