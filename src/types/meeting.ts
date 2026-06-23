export type MeetingType = 'face-to-face' | 'hybrid' | 'virtual' | string
export type MeetingStatus =
  | 'closed'
  | 'cancelled'
  | 'registration-open'
  | 'confirmed'
  | 'tentative'
  | 'scheduled'
  | string

export interface MeetingSession {
  iso_meeting_id: number | null
  type: MeetingType
  status: MeetingStatus
  start_date: string | null
  end_date: string | null
  country: string | null
  city: string | null
  address: string | null
  virtual_address: string | null
  participants: number | null
  iso_meeting_url: string | null
  cancellation_comment: string | null
  reschedule_note: string | null
  reschedule_timeframe: string | null
  parent_iso_meeting_id: number | null
}

export interface ResolvedHost {
  ref?: string
  type?: 'national-body' | 'liaison'
  name?: string
  short_name?: string
  url?: string
  path?: string
  logo?: string
  logo_light?: string
  logo_dark?: string
  contact?: AssociateContact
  kind: 'national-body' | 'liaison' | 'unknown'
}

export interface AssociateContact {
  name?: string
  title?: string
  email?: string
}

export type AssociateKind = 'national-body' | 'liaison' | 'associate' | 'inline'

export interface ResolvedAssociate {
  ref?: string
  type?: 'national-body' | 'liaison' | 'associate' | 'inline'
  name?: string
  short_name?: string
  url?: string
  path?: string
  logo?: string
  logo_light?: string
  logo_dark?: string
  country?: string
  category?: string
  role?: string
  parent_ref?: string
  contact?: AssociateContact
  kind: AssociateKind
}

export interface RichMeetingData {
  title?: string
  general_area?: string
  host?: string
  hosts?: ResolvedHost[]
  associates?: ResolvedAssociate[]
  time?: { from?: { date?: string }; to?: { date?: string } }
  venues?: import('./event').EventVenue[]
  secretariat?: import('./event').EventContact
  schedule?: import('./event').EventScheduleItem[]
  deadlines?: import('./event').EventDeadline[]
  accommodation_options?: import('./event').EventAccommodation[]
  practical_info?: import('./event').EventPracticalInfo
  lunch_recommendations?: import('./event').EventAccommodation[]
  biergartens?: import('./event').EventAccommodation[]
  tourist_info?: import('./event').PracticalSection | import('./event').EventAccommodation[]
  local_contact?: import('./event').EventContact
  landing_url?: string
  registration_url?: string
}

export interface Meeting {
  ordinal: number
  year: number | null
  url: string
  sessions: MeetingSession[]
  primary: MeetingSession
  status_label: string
  type_label: string
  location_label: string
  date_label: string
  participant_total: number | null
  resolution_count: number
  acclamation_count: number
  resolutions_url: string | null
  resolutions_meeting_urn: string | null
  rich?: RichMeetingData
}
