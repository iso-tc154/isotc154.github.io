import {
  resolutionUrn,
  resolutionPath,
  meetingUrnFromParts,
  meetingDetailPathFromParts,
} from '../../src/utils/urn.ts'

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

// Extract the first (eng) Localization from a v2.1 Decision.
function primaryLocalization(decision) {
  if (!decision.localizations || decision.localizations.length === 0) return {}
  return decision.localizations[0]
}

export function deriveDisplayTitle(loc, acclamation) {
  if (loc.title) return loc.title
  if (acclamation && loc.actions && loc.actions.length > 0) return 'Acclamation'
  return ''
}

export function buildResolutionRecord(decision, sourceType, sourceFile, metadata) {
  const loc = primaryLocalization(decision)
  const idList = decision.identifier || []
  const identifier = idList.length > 0 ? String(idList[0].number) : ''
  const acclamation = isAcclamation(identifier)

  // v2.1 metadata.date is a single date string (not an array).
  const meetingDate = metadata.date || ''
  const year = meetingDate ? meetingDate.substring(0, 4) : ''
  const sourceTitle = metadata.title || ''

  return {
    id: identifier,
    urn: resolutionUrn(identifier),
    title: deriveDisplayTitle(loc, acclamation),
    subject: loc.subject || '',
    year,
    venue: '',
    source_type: sourceType,
    source_file: sourceFile,
    source_title: sourceTitle,
    meeting_date: meetingDate,
    is_acclamation: acclamation,
    actions: loc.actions || [],
    considerations: loc.considerations || [],
    approvals: loc.approvals || [],
    categories: decision.categories || [],
    dates: decision.dates || [],
    snippet: normalizeSnippet(loc.actions && loc.actions.length > 0 ? loc.actions[0].message : ''),
    meeting_urn: meetingUrnFromParts(sourceType, sourceFile),
    path: resolutionPath(sourceType, sourceFile, identifier),
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

export function buildMeetingRecord(sourceType, sourceFile, metadata, resolutionsForMeeting) {
  // v2.1 metadata.date is a single date string (not an array).
  const meetingDate = metadata.date || ''
  const year = meetingDate ? meetingDate.substring(0, 4) : ''
  const sourceTitle = metadata.title || ''
  const resolutionCount = resolutionsForMeeting.length
  const acclamationCount = resolutionsForMeeting.filter(r => r.is_acclamation).length
  return {
    source_type: sourceType,
    source_file: sourceFile,
    source_title: sourceTitle,
    meeting_date: meetingDate,
    venue: '',
    year,
    resolution_count: resolutionCount,
    acclamation_count: acclamationCount,
    path: meetingDetailPathFromParts(sourceType, sourceFile),
    meeting_urn: meetingUrnFromParts(sourceType, sourceFile),
  }
}
