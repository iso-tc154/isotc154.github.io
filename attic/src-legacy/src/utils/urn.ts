import { meetingSourceFromParts, type MeetingSource } from '../domain/meetingSource.ts'

export const URN_BASE = 'urn:iso:tc:154'

// === Resolution identifiers ===

export function resolutionUrn(id: string): string {
  return `${URN_BASE}:resolution:${id}`
}

export function resolutionPath(sourceType: string, sourceFile: string, id: string): string {
  return `/resolutions/${sourceType}/${sourceFile}/${id}/`
}

// Lifecycle events and convenor terms only carry the resolution id (e.g.
// "003-2013" or "P-2025-10") — the source_type/source_file needed for the
// canonical detail path is not known at the call site. Link to the list
// view with the id as a search query, matching the convention used by
// HistoryView for ref-based deep links.
export function resolutionRefSearchPath(ref: string): string {
  return `/resolutions/?q=${encodeURIComponent(ref)}`
}

// === Meeting identifiers ===

export function meetingUrn(source: MeetingSource): string {
  return `${URN_BASE}:meeting:${source.kind}:${source.raw}`
}

export function meetingUrnFromParts(sourceType: string, sourceFile: string): string {
  const src = meetingSourceFromParts(sourceType, sourceFile)
  return src
    ? meetingUrn(src)
    : `${URN_BASE}:meeting:${sourceType}:${sourceFile}`
}

export function meetingDetailPath(source: MeetingSource): string {
  if (source.kind === 'plenary' && source.ordinal !== null) return `/meetings/${source.ordinal}/`
  return meetingListFilterPath(source)
}

export function meetingDetailPathFromParts(sourceType: string, sourceFile: string): string {
  const src = meetingSourceFromParts(sourceType, sourceFile)
  return src
    ? meetingDetailPath(src)
    : `/resolutions/?meeting=${sourceType}/${sourceFile}`
}

export function meetingListFilterPath(source: MeetingSource): string {
  return `/resolutions/?meeting=${source.kind}/${source.raw}`
}

// === Standard identifiers ===

export function standardUrn(id: string): string {
  return `${URN_BASE}:standard:${id}`
}

export function standardPath(id: string): string {
  return `/standards/${id}/`
}

// === Project identifiers ===

export function projectUrn(id: string): string {
  return `${URN_BASE}:project:${id}`
}

export function projectPath(id: string): string {
  return `/projects/${id}/`
}

// === Organization identifiers ===

export function memberPath(id: string): string {
  return `/members/${id}/`
}

export function memberUrn(id: string): string {
  return `${URN_BASE}:member:${id}`
}

export function nationalBodyPath(id: string): string {
  return `/national-bodies/${id}/`
}

export function liaisonPath(id: string): string {
  return `/liaisons/${id}/`
}

// === Query-string parsing ===

export function parseMeetingParam(param: string | null | undefined): { sourceType: string; sourceFile: string } | null {
  if (!param) return null
  const parts = param.split('/')
  if (parts.length !== 2) return null
  const [sourceType, sourceFile] = parts
  if (!sourceType || !sourceFile) return null
  return { sourceType, sourceFile }
}
