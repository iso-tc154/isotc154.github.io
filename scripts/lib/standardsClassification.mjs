// Standards status partitioning and balloting-stage classification.
//
// ISO/TC 154 tracks each catalogue entry's lifecycle state in
// `tc154.status` (published / withdrawn / under_development) and the
// ISO harmonized stage code in `iso.stage`. This module owns the
// pure rules that turn those fields into the partitions the site
// surfaces (published catalogue, active comment periods, latest
// publication banner).

import { toISODate } from './dates.mjs'

// Stage codes: 40.x = DIS, 50.x = DTR/DTS — both are national-body
// balloting stages where the document is open for comment.
export function isOpenForComment(stage) {
  const s = String(stage || '')
  if (!s) return false
  const n = parseFloat(s)
  return !Number.isNaN(n) && n >= 40 && n < 60
}

export function partitionByStatus(standards) {
  const published = []
  const withdrawn = []
  const underDevelopment = []
  for (const s of standards) {
    const status = s.tc154?.status || 'published'
    if (status === 'published') published.push(s)
    else if (status === 'withdrawn') withdrawn.push(s)
    else if (status === 'under_development') underDevelopment.push(s)
  }
  return { published, withdrawn, underDevelopment }
}

export function filterOpenForComment(underDevelopment) {
  return underDevelopment
    .filter((s) => isOpenForComment(s.iso?.stage))
    .sort((a, b) => parseFloat(b.iso?.stage || '0') - parseFloat(a.iso?.stage || '0'))
}

export function latestPublication(published) {
  const sortDesc = (a, b) =>
    toISODate(b.iso?.publication_date).localeCompare(toISODate(a.iso?.publication_date))
  return published.slice().sort(sortDesc).find((s) => s.iso?.publication_date)
}
