import type { Standard } from '../types/standard'
import { standardPath } from '../utils/urn'

export function standardStatusLabel(status?: string): string {
  if (!status) return ''
  switch (status.toLowerCase()) {
    case 'published': return 'Published'
    case 'withdrawn': return 'Withdrawn'
    case 'current': return 'Current'
    case 'under-development':
    case 'under_development': return 'Under development'
    case 'under-review':
    case 'under_review': return 'Under review'
    case 'deleted': return 'Deleted'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export function standardByRaw(all: Standard[], raw: string): Standard | undefined {
  return all.find(s => s.iso?.name === raw)
}

export function slugifyStandard(raw: string): string {
  return raw.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

export function standardYear(s?: Standard): string {
  if (!s?.iso?.publication_date) return ''
  return String(s.iso.publication_date).slice(0, 4)
}

export function standardUrl(s: Standard): string {
  return standardPath(s.id)
}

export function standardUrlFromRaw(all: Standard[], raw: string): string {
  const found = standardByRaw(all, raw)
  return standardPath(found?.id ?? slugifyStandard(raw))
}
