export type EventStatus = 'upcoming' | 'completed'

export interface EventDateBound {
  date: string
  precision?: string
}

export interface EventTime {
  from: EventDateBound
  to: EventDateBound
}

export interface EventVenue {
  name?: string
  address?: string
  link?: string
  lon?: number
  lat?: number
  note?: string
}

export interface EventContact {
  name?: string
  organization?: string
  email?: string
  phone?: string
}

export interface EventScheduleItem {
  date: string
  time?: string
  event?: string
  description?: string
}

export interface EventDeadline {
  date?: string
  label?: string
  description?: string
}

export interface EventAccommodation {
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

export interface EventPracticalInfo extends PracticalSection {}

export interface PlenaryEvent {
  id: string
  url: string
  landing_url?: string
  title: string
  ordinal: number
  status: EventStatus
  year: number
  time: EventTime
  general_area?: string
  venues?: EventVenue[]
  host?: string
  secretariat?: EventContact
  schedule?: EventScheduleItem[]
  deadlines?: EventDeadline[]
  accommodation_options?: EventAccommodation[]
  practical_info?: EventPracticalInfo
  lunch_recommendations?: EventAccommodation[]
  biergartens?: EventAccommodation[]
  tourist_info?: PracticalSection | EventAccommodation[]
  local_contact?: EventContact
}
