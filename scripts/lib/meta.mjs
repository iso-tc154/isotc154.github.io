// Selection rules behind meta.json and the ⌘K search index. Pure —
// build-data supplies the loaded collections.

/**
 * The next plenary: earliest by start date among upcoming events;
 * ordinal breaks exact-date ties. A stale `upcoming` status (never
 * flipped after a meeting) must not shadow a correctly-dated later one.
 */
export function nextPlenary(events, toDateStr) {
  const upcoming = events.filter((e) => e.status === 'upcoming')
  if (!upcoming.length) return null
  return upcoming
    .slice()
    .sort((a, b) => {
      // toISODate yields '' (not null) for absent dates; || catches that too
      const da = toDateStr(a.time?.from?.date) || '9999-12-31'
      const db = toDateStr(b.time?.from?.date) || '9999-12-31'
      if (da !== db) return da.localeCompare(db)
      return (a.ordinal || 0) - (b.ordinal || 0)
    })[0]
}

/**
 * The newest resolution: meeting_date descending. Ballot resolutions
 * carry no meeting date; among ties (including all-undated), the
 * loader's order decides — stable sort preserves it, and the loader
 * emits newest-ballot-first.
 */
export function latestResolution(resolutions, toDateStr) {
  if (!resolutions.length) return null
  return resolutions
    .slice()
    .sort((a, b) => toDateStr(b.meeting_date).localeCompare(toDateStr(a.meeting_date)))[0]
}

/** The ⌘K omnibar index: one entry per standard/member/meeting/post/resolution. */
export function buildSearchIndex({ standards, members, meetings, posts, resolutions }) {
  const index = []
  for (const s of standards) {
    index.push({ t: s.iso?.name ?? s.id, s: s.iso?.title ?? '', u: s.url ?? `/standards/${s.id}/`, k: 'Standard' })
  }
  for (const m of Object.values(members.all ?? {})) {
    index.push({ t: m.name, s: m.affiliation ?? '', u: m.url ?? `/members/${m['member-id']}/`, k: 'Member' })
  }
  for (const m of meetings) {
    const label = m.ordinal != null ? `${m.ordinal} plenary` : `${m.year ?? ''} plenary`.trim()
    index.push({ t: label, s: `${m.location_label ?? ''} ${m.year ?? ''}`.trim(), u: m.url, k: 'Meeting' })
  }
  for (const p of posts) {
    index.push({ t: p.frontmatter?.title ?? p.slug, s: '', u: `/posts/${p.slug}/`, k: 'News' })
  }
  for (const r of resolutions) {
    index.push({ t: r.id, s: r.title ?? '', u: `/decisions/${r.urn}/`, k: 'Resolution' })
  }
  return index
}
