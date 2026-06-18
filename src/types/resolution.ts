export interface Action {
  type: string
  subject?: string
  message: string
  dates?: any[]
}

export interface Consideration {
  type: string
  message: string
  dates?: any[]
}

export interface Approval {
  type: string
  degree: string
  message?: string
}

export interface Resolution {
  id: string
  urn: string
  title: string
  subject: string
  year: string
  venue: string
  source_type: string
  source_file: string
  source_title: string
  meeting_date: string
  is_acclamation: boolean
  actions: Action[]
  considerations: Consideration[]
  approvals: Approval[]
  categories?: string[]
  dates: any[]
  snippet: string
  meeting_urn: string
  path: string
}

export interface Meeting {
  source_type: string
  source_file: string
  source_title: string
  meeting_date: string
  venue: string
  year: string
  resolution_count: number
  acclamation_count: number
  path: string
  meeting_urn: string
}
