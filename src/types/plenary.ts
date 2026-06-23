/**
 * Canonical type model for TC 154 plenary meetings.
 *
 * The pipeline has two shapes:
 *   - {@link PlenarySource} — the raw YAML record in `_data/events/plenary-meeting-N.yml`
 *   - {@link Plenary} — the normalized view-model consumed by pages
 *
 * Auxiliary types (venue, contact, schedule, etc.) describe rich-data
 * sub-objects shared between the two shapes.
 */

export type PlenaryStatus = 'upcoming' | 'completed'

export interface PlenaryDateBound {
  date: string
  precision?: string
}

export interface PlenaryTime {
  from: PlenaryDateBound
  to: PlenaryDateBound
}

export interface PlenaryVenue {
  name?: string
  address?: string
  link?: string
  lon?: number
  lat?: number
  note?: string
}

export interface PlenaryContact {
  name?: string
  organization?: string
  email?: string
  phone?: string
}

export interface PlenaryScheduleItem {
  date: string
  time?: string
  event?: string
  description?: string
}

export interface PlenaryDeadline {
  date?: string
  label?: string
  description?: string
}

export interface PlenaryAccommodation {
  name?: string
  address?: string
  link?: string
  url?: string
  email?: string
  notes?: string
  price?: string
  code?: string
  distance?: string
  breakfast?: string
  rates?: { [k: string]: string }
  walk_minutes?: number
  style?: string
}

export type PracticalValue =
  | string
  | number
  | boolean
  | string[]
  | PracticalSection
  | undefined

export interface PracticalSection {
  [k: string]: PracticalValue
}

export interface PlenaryPracticalInfo extends PracticalSection {}

export interface PlenarySource {
  id: string
  url: string
  landing_url?: string
  title: string
  ordinal: number
  status: PlenaryStatus
  year: number
  time: PlenaryTime
  general_area?: string
  venues?: PlenaryVenue[]
  host?: string
  secretariat?: PlenaryContact
  schedule?: PlenaryScheduleItem[]
  deadlines?: PlenaryDeadline[]
  accommodation_options?: PlenaryAccommodation[]
  practical_info?: PlenaryPracticalInfo
  lunch_recommendations?: PlenaryAccommodation[]
  biergartens?: PlenaryAccommodation[]
  tourist_info?: PracticalSection | PlenaryAccommodation[]
  local_contact?: PlenaryContact
}

export type PlenarySessionType = 'face-to-face' | 'hybrid' | 'virtual' | string
export type PlenarySessionStatus =
  | 'closed'
  | 'cancelled'
  | 'registration-open'
  | 'confirmed'
  | 'tentative'
  | 'scheduled'
  | string

export interface PlenarySession {
  iso_meeting_id: number | null
  type: PlenarySessionType
  status: PlenarySessionStatus
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

export interface RichPlenaryData {
  title?: string
  general_area?: string
  host?: string
  hosts?: ResolvedHost[]
  associates?: ResolvedAssociate[]
  time?: { from?: { date?: string }; to?: { date?: string } }
  venues?: PlenaryVenue[]
  secretariat?: PlenaryContact
  schedule?: PlenaryScheduleItem[]
  deadlines?: PlenaryDeadline[]
  accommodation_options?: PlenaryAccommodation[]
  practical_info?: PlenaryPracticalInfo
  lunch_recommendations?: PlenaryAccommodation[]
  biergartens?: PlenaryAccommodation[]
  tourist_info?: PracticalSection | PlenaryAccommodation[]
  local_contact?: PlenaryContact
  landing_url?: string
  registration_url?: string
}

export interface Plenary {
  ordinal: number
  year: number | null
  url: string
  sessions: PlenarySession[]
  primary: PlenarySession
  status_label: string
  type_label: string
  location_label: string
  date_label: string
  participant_total: number | null
  resolution_count: number
  acclamation_count: number
  resolutions_url: string | null
  resolutions_meeting_urn: string | null
  rich?: RichPlenaryData
}
