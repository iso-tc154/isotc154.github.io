export const URN_BASE = 'urn:iso:tc:154'

const PUA_BULLET_REPLACEMENTS = [
  [//g, '•'],
  [//g, '‣'],
  [//g, '▸'],
  [//g, ' '],
]

export function normalizeSnippet(rawMessage) {
  if (!rawMessage) return ''
  let snippet = rawMessage
  for (const [pattern, replacement] of PUA_BULLET_REPLACEMENTS) {
    snippet = snippet.replace(pattern, replacement)
  }
  snippet = snippet
    .replace(/\n+/g, ' ')
    .replace(/  +/g, ' ')
    .trim()
  if (snippet.length > 200) {
    snippet = snippet.substring(0, 197) + '...'
  }
  return snippet
}

export function isAcclamation(identifier) {
  return String(identifier).includes('-acclaim-')
}

export function deriveDisplayTitle(res, acclamation) {
  if (res.title) return res.title
  if (acclamation && res.actions && res.actions.length > 0) return 'Acclamation'
  return ''
}

export function buildResolutionRecord(res, sourceType, sourceFile, metadata) {
  const identifier = String(res.identifier)
  const acclamation = isAcclamation(identifier)
  const datesInfo = metadata.dates || []
  const meetingDate = datesInfo.length > 0 ? datesInfo[0].start : ''
  const year = meetingDate ? meetingDate.substring(0, 4) : ''
  const venue = metadata.venue || ''
  const sourceTitle = metadata.title || ''
  const path = `/resolutions/${sourceType}/${sourceFile}/${identifier}/`

  return {
    id: identifier,
    urn: `${URN_BASE}:resolution:${identifier}`,
    title: deriveDisplayTitle(res, acclamation),
    subject: res.subject || '',
    year,
    venue,
    source_type: sourceType,
    source_file: sourceFile,
    source_title: sourceTitle,
    meeting_date: meetingDate,
    is_acclamation: acclamation,
    actions: res.actions || [],
    considerations: res.considerations || [],
    approvals: res.approvals || [],
    categories: res.categories || [],
    dates: res.dates || [],
    snippet: normalizeSnippet(res.actions && res.actions.length > 0 ? res.actions[0].message : ''),
    meeting_urn: `${URN_BASE}:meeting:${sourceType}:${sourceFile}`,
    path,
  }
}

export function sortResolutions(a, b) {
  if (a.meeting_date !== b.meeting_date) {
    return (b.meeting_date || '').localeCompare(a.meeting_date || '')
  }
  const aIsAcc = isAcclamation(a.id)
  const bIsAcc = isAcclamation(b.id)
  if (!aIsAcc && !bIsAcc) {
    const aNum = parseFloat(a.id)
    const bNum = parseFloat(b.id)
    if (!isNaN(aNum) && !isNaN(bNum)) return bNum - aNum
    return (b.id || '').localeCompare(a.id)
  }
  if (aIsAcc !== bIsAcc) return aIsAcc ? 1 : -1
  return (b.id || '').localeCompare(a.id)
}

// Build-time adapter: derives a meeting record per source from parsed YAML
// metadata + records. The runtime counterpart is the pure
// `groupResolutionsByMeeting` in `src/utils/groupByMeeting.ts`, which derives
// the same shape from already-stamped resolution records. Both adapters
// produce MeetingSummary records; the stamped fields on each resolution
// (source_title, venue, meeting_date, year) are the contract between them.
export function buildMeetingRecord(sourceType, sourceFile, metadata, resolutionsForMeeting) {
  const datesInfo = metadata.dates || []
  const meetingDate = datesInfo.length > 0 ? datesInfo[0].start : ''
  const year = meetingDate ? meetingDate.substring(0, 4) : ''
  const venue = metadata.venue || ''
  const sourceTitle = metadata.title || ''
  const resolutionCount = resolutionsForMeeting.length
  const acclamationCount = resolutionsForMeeting.filter(r => r.is_acclamation).length
  const plenaryMatch = sourceFile.match(/^plenary-(\d+)$/)
  const path = plenaryMatch
    ? `/meetings/${plenaryMatch[1]}/`
    : `/resolutions/meetings/${sourceType}/${sourceFile}/`
  return {
    source_type: sourceType,
    source_file: sourceFile,
    source_title: sourceTitle,
    meeting_date: meetingDate,
    venue,
    year,
    resolution_count: resolutionCount,
    acclamation_count: acclamationCount,
    path,
    meeting_urn: `${URN_BASE}:meeting:${sourceType}:${sourceFile}`,
  }
}
