export interface GroupCollaborativeParty {
  entity_name: string
  projects?: string[]
  description?: string
}

export type LifecycleEventType =
  | 'established'
  | 'dissolved'
  | 'convenor_appointed'
  | 'convenor_extended'
  | 'scope_change'
  | 'succession'
  | 'title_change'
  | 'note'

export type DatePrecision = 'year' | 'month' | 'day'

export interface GroupLifecycleEvent {
  type: LifecycleEventType
  date: string
  precision?: DatePrecision
  title: string
  description?: string
  resolution_ref?: string
  resolution_meeting?: string
  person_name?: string
  person_member_id?: string
  term_until?: string
  predecessor?: string
  successor?: string
}

export interface GroupLineageLink {
  id: string
  name: string
  date?: string
  resolution_ref?: string
}

export interface ConvenorTerm {
  member_id: string
  name: string
  from: string
  to: string | null
  current: boolean
  role?: string
  resolution_ref?: string
}

export interface GroupEstablished {
  date: string
  precision?: DatePrecision
  resolution_ref?: string
  resolution_meeting?: string
  predecessor?: string
}

export interface GroupDissolved {
  date: string
  precision?: DatePrecision
  resolution_ref?: string
  resolution_meeting?: string
  successor?: string
}

export interface GroupHistory {
  leadership?: string[]
  story?: string
  events?: GroupLifecycleEvent[]
  established?: GroupEstablished
  dissolved?: GroupDissolved
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
  convenor_terms?: ConvenorTerm[]
  predecessor?: GroupLineageLink
  successor?: GroupLineageLink
  collaborative_parties?: GroupCollaborativeParty[]
  _description?: string
  url?: string
}

export type LifecycleStatus = 'active' | 'inactive' | 'dissolved'

export interface SubnavSection {
  id: string
  label: string
}

// Display helpers (groupCategoryLabel, lifecycleStatus) live in
// src/domain/groupPresentation.ts — this file is shape declarations only.
