import type { Project } from '../types/project'

export function projectStatusLabel(status?: string): string {
  if (!status) return ''
  switch (status.toLowerCase()) {
    case 'current': return 'Current'
    case 'deleted': return 'Deleted'
    case 'withdrawn': return 'Withdrawn'
    case 'new': return 'New'
    case 'under-development':
    case 'under_development': return 'Under development'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}

export function projectScopeExcerpt(p: Project): string {
  if (!p.scope) return ''
  const text = p.scope
    .replace(/^==\s*.*$/gm, '')
    .replace(/\*\*/g, '')
    .replace(/\n{2,}/g, '\n\n')
    .trim()
  const firstPara = text.split(/\n\n/)[0] ?? ''
  return firstPara.length > 280 ? firstPara.slice(0, 280).trimEnd() + '…' : firstPara
}
