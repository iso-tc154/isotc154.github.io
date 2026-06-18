export const URN_BASE = 'urn:iso:tc:154'

export function buildResolutionUrn(id: string): string {
  return `${URN_BASE}:resolution:${id}`
}

export function buildMeetingUrn(sourceType: string, sourceFile: string): string {
  return `${URN_BASE}:meeting:${sourceType}:${sourceFile}`
}

export function resolutionPath(sourceType: string, sourceFile: string, id: string): string {
  return `/resolutions/${sourceType}/${sourceFile}/${id}/`
}

export function meetingPath(sourceType: string, sourceFile: string): string {
  const m = sourceFile.match(/^plenary-(\d+)$/)
  if (m) return `/meetings/${m[1]}/`
  return `/resolutions/meetings/${sourceType}/${sourceFile}/`
}
