export interface Project {
  id: string
  name: string
  title?: string
  status?: string
  stage?: string
  scope?: string
  url?: string
}

export function projectStatusLabel(status?: string): string {
  if (!status) return ''
  switch (status.toLowerCase()) {
    case 'current': return 'Current'
    case 'deleted': return 'Deleted'
    case 'withdrawn': return 'Withdrawn'
    case 'under-development': return 'Under development'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}
