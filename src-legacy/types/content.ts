export interface Standard {
  iso: {
    name: string
    type: string
    title: string
    stage: string
    ics: string
    scope: string
    publication_date: string
    store_id: number | string
  }
  tc154: {
    group?: string
    status?: string
  }
  id: string
  url: string
}

export interface Project {
  id: string
  title?: string
  status?: string
  [key: string]: any
  url: string
}

export interface EventScheduleItem {
  date?: string
  time?: string
  event?: string
  description?: string
}

export interface EventVenue {
  name?: string
  address?: string
  link?: string
  note?: string
}

export interface PlenaryEvent {
  id: string
  title: string
  ordinal: number
  status: string
  year: number
  landing_url?: string
  general_area?: string
  time?: {
    from?: { date: string }
    to?: { date: string }
  }
  venues?: EventVenue[]
  host?: string
  secretariat?: {
    name?: string
    organization?: string
    email?: string
    phone?: string
  }
  schedule?: EventScheduleItem[]
  url: string
}

export interface Organization {
  id: string
  name: string
  short_name?: string
  category?: string
  url?: string
  logo?: string
  logo_light?: string
  logo_dark?: string
  description?: string
  membership?: string
  iso_country_code?: string
  country?: string
}

export interface PostFrontmatter {
  title?: string
  date?: string
  layout?: string
  tags?: string[]
  author?: string
  categories?: string
  excerpt?: string
  [key: string]: any
}

export interface Post {
  slug: string
  date: string
  html: string
  frontmatter: PostFrontmatter
  url: string
}

export interface PageFrontmatter {
  title?: string
  permalink?: string
  layout?: string
  [key: string]: any
}

export interface PageDoc {
  slug: string
  html: string
  frontmatter: PageFrontmatter
  url: string
}
