export interface GroupCollaborativeParty {
  entity_name: string
  projects?: string[]
  description?: string
}

export interface GroupHistory {
  leadership?: string[]
  story?: string
}

export interface Group {
  id: string
  _id?: string
  name: string
  title: string
  category: string
  order: number
  inactive?: boolean
  featured_on_home?: boolean
  scope?: string
  intro?: string
  active_projects?: string[]
  standards?: string[]
  members?: string[]
  past_members?: string[]
  convenors?: string[]
  co_chairs?: string[]
  managers?: string[]
  organization?: { convenors?: string[]; co_chairs?: string[]; managers?: string[] }
  history?: GroupHistory
  collaborative_parties?: GroupCollaborativeParty[]
  _description?: string
  url?: string
}

export function groupCategoryLabel(category: string): string {
  switch (category) {
    case 'working': return 'Working Group'
    case 'advisory': return 'Advisory Group'
    case 'cag': return 'Chairman\'s Advisory Group'
    case 'joint': return 'Joint Working Group'
    case 'ahwg': return 'Ad Hoc Working Group'
    case 'sg': return 'Study Group'
    case 'rtc': return 'Resolution Drafting Group'
    default: return category.charAt(0).toUpperCase() + category.slice(1)
  }
}
