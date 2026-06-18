export interface StandardIso {
  name: string
  type?: string
  title?: string
  stage?: string
  ics?: string
  scope?: string
  publication_date?: string
  store_id?: number
  current_stage?: { code: string; description: string; edition: number }
}

export interface StandardTc154 {
  group?: string
  status?: string
  scope?: string
  introduction?: string
}

export interface Standard {
  iso: StandardIso
  tc154?: StandardTc154
  id: string
  url: string
}

export function standardStatusLabel(status?: string): string {
  if (!status) return ''
  switch (status.toLowerCase()) {
    case 'published': return 'Published'
    case 'withdrawn': return 'Withdrawn'
    case 'current': return 'Current'
    case 'under-development': return 'Under development'
    case 'under-review': return 'Under review'
    case 'deleted': return 'Deleted'
    default: return status.charAt(0).toUpperCase() + status.slice(1)
  }
}
