import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve('./public/data')

const jsonCache = new Map<string, unknown>()

function readJson<T>(name: string): T {
  if (!jsonCache.has(name)) {
    jsonCache.set(name, JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf-8')))
  }
  return jsonCache.get(name) as T
}

export interface PageDoc {
  slug: string
  url: string
  html: string
  frontmatter: {
    title?: string
    eyebrow?: string
    lead?: string
    description?: string
    permalink?: string
    layout?: string
    [k: string]: unknown
  }
}

export interface RoleRecord {
  id?: string
  group?: string
  from?: { date?: string; precision?: 'day' | 'month' | 'year' }
  to?: { date?: string; precision?: 'day' | 'month' | 'year' } | null
}

export interface Member {
  'member-id': string
  name: string
  active: boolean
  deceased?: boolean
  affiliation?: string
  picture?: string
  bio?: string
  roles?: { [role: string]: { in: { [group: string]: RoleRecord[] } } }
  links?: { label?: string; title?: string; url: string }[]
  url?: string
  is_current?: boolean
  is_the_chair?: boolean
  is_in_leadership?: boolean
}

export interface MembersData {
  all: Record<string, Member>
  chair: Member | null
  current: Member[]
  past: Member[]
  leadership: Member[]
}

export interface Standard {
  id: string
  url: string
  iso: {
    name: string
    type?: string
    title?: string
    stage?: string
    publication_date?: string | null
    ics?: string
    store_id?: number | null
    scope?: string
  }
  tc154: {
    status?: string
    group?: string
    introduction?: string
    scope?: string
    [k: string]: unknown
  }
}

export interface Group {
  id: string
  name?: string
  title?: string
  category?: string
  order?: number
  intro?: string
  scope?: string
  active_projects?: string[]
  standards?: string[]
  members?: string[]
  past_members?: string[]
  convenors?: string[]
  co_chairs?: string[]
  managers?: string[]
  inactive?: boolean
  history?: { story?: string; dissolved?: { date?: string } | boolean; established?: { date?: string } }
  predecessor?: { name?: string }
  successor?: { name?: string }
  url?: string
}

export interface Project {
  id: string
  url: string
  name: string
  title?: string
  status?: string
  stage?: string
  scope?: string
  leaders?: string[]
  editors?: string[]
}

export interface Liaison {
  id: string
  url?: string
  name: string
  short_name?: string
  description?: string
  category?: string
  logo?: string
  logo_light?: string
  logo_dark?: string
}

export interface NationalBody {
  id: string
  url?: string
  name: string
  short_name?: string
  description?: string
  country?: string
  iso_country_code?: string
  membership?: string
  logo?: string
  logo_light?: string
  logo_dark?: string
  former?: boolean
  former_until?: string | number
}

export interface MeetingSession {
  type?: string
  country?: string
  city?: string
  virtual_address?: string
  iso_meeting_id?: string | number
  iso_meeting_url?: string
  start_date?: string
  end_date?: string
}

export interface MeetingHost {
  name: string
  short_name?: string
  kind?: string
  url?: string
  path?: string
  logo?: string
  logo_light?: string
  logo_dark?: string
  country?: string
  contact?: { name?: string; title?: string }
}

export interface MeetingAssociate extends MeetingHost { role?: string }

export interface AgendaItem {
  number?: number
  title: string
  speaker?: string
  n_doc?: string
  subitems?: AgendaItem[]
}

export interface AgendaSession {
  date?: string
  note?: string
  items?: AgendaItem[]
}

export interface RichMeeting {
  general_area?: string
  country_code?: string
  registration_url?: string
  host?: string
  hosts?: MeetingHost[]
  associates?: MeetingAssociate[]
  venues?: { name?: string; address?: string; note?: string; link?: string; lat?: number; lon?: number }[]
  secretariat?: { name?: string; organization?: string; email?: string; phone?: string }
  schedule?: { date?: string; time?: string; event?: string; description?: string }[]
  deadlines?: { date?: string; label?: string; description?: string }[]
  accommodation_options?: { name: string; address?: string; link?: string; email?: string; distance?: string; code?: string; rates?: Record<string, string>; price?: string; breakfast?: string; notes?: string }[]
  practical_info?: Record<string, unknown>
  lunch_recommendations?: { name: string; address?: string; link?: string; url?: string; notes?: string }[]
  biergartens?: { name: string; address?: string; link?: string; url?: string; walk_minutes?: number; style?: string; notes?: string }[]
  tourist_info?: unknown
  agenda?: {
    source_doc?: string
    structure?: string
    opening_session?: AgendaSession
    closing_session?: AgendaSession
    wg_meetings?: { dates?: string; note?: string }
  }
}

export interface Meeting {
  ordinal?: number
  year?: number
  id: string
  url: string
  sessions: MeetingSession[]
  primary: MeetingSession & {
    country?: string
    city?: string
    reschedule_note?: string
    reschedule_timeframe?: string
    cancellation_comment?: string
    iso_meeting_url?: string
  }
  status_label?: string
  type_label?: string
  location_label?: string
  date_label?: string
  general_area?: string
  from_date?: string | null
  to_date?: string | null
  participant_total?: number
  resolution_count?: number
  rich?: RichMeeting
}

export interface HistoryMilestone {
  date: string
  date_precision?: 'day' | 'month' | 'year'
  category: string
  title: string
  description?: string
  link?: string
  resolution?: string
}

export interface AcknowledgmentEntry {
  name: string
  affiliation?: string
  date?: string
  standard?: string
  contribution?: string
  url?: string
}

export interface Post {
  slug: string
  url: string
  date: string
  html: string
  frontmatter: {
    title?: string
    excerpt?: string
    author?: string
    tags?: string[]
    [k: string]: unknown
  }
}

export interface SiteMeta {
  generatedAt: string
  counts: Record<string, number>
  current: {
    latestPublication: {
      id: string; url: string; name: string; title: string; publication_date: string | null
    } | null
    latestResolution: {
      id: string; url: string; title: string; meeting_date: string | null; source_title: string
    } | null
    openForComment: {
      id: string; url: string; name: string; title: string; stage: string; store_id?: number | null
    }[]
    nextPlenary: {
      id: string; url: string; ordinal: number; general_area: string
      country_code?: string | null
      from_date: string | null; to_date: string | null; registration_url?: string | null
    } | null
  }
}

export const loadData = {
  pages: (): PageDoc[] => readJson<PageDoc[]>('pages.json'),
  page: (url: string): PageDoc | undefined =>
    loadData.pages().find((p) => p.url === url || p.frontmatter.permalink === url),
  members: (): MembersData => readJson<MembersData>('members.json'),
  member: (id: string): Member | undefined => loadData.members().all[id],
  standards: (): Standard[] => readJson<Standard[]>('standards.json'),
  standard: (id: string): Standard | undefined => {
    const list = loadData.standards()
    return list.find((s) => s.id === id) ?? list.find((s) => s.url === `/standards/${id}/`)
  },
  groups: (): Group[] => readJson<Group[]>('groups.json'),
  group: (id: string): Group | undefined => {
    const list = loadData.groups()
    return list.find((g) => g.id === id) ?? list.find((g) => g.url === `/groups/${id}/`)
  },
  projects: (): Project[] => readJson<Project[]>('projects.json'),
  project: (id: string): Project | undefined => {
    const list = loadData.projects()
    return list.find((p) => p.id === id) ?? list.find((p) => p.url === `/projects/${id}/`)
  },
  liaisons: (): Liaison[] => readJson<Liaison[]>('liaisons.json'),
  liaison: (id: string): Liaison | undefined => {
    const list = loadData.liaisons()
    return list.find((l) => l.id === id) ?? list.find((l) => l.url === `/liaisons/${id}/`)
  },
  nationalBodies: (): NationalBody[] => readJson<NationalBody[]>('national-bodies.json'),
  nationalBody: (id: string): NationalBody | undefined => {
    const list = loadData.nationalBodies()
    return list.find((n) => n.id === id) ?? list.find((n) => n.url === `/national-bodies/${id}/`)
  },
  meetings: (): Meeting[] => readJson<Meeting[]>('meetings.json'),
  posts: (): Post[] => readJson<Post[]>('posts.json'),
  post: (slug: string): Post | undefined => loadData.posts().find((p) => p.slug === slug),
  meta: (): SiteMeta => readJson<SiteMeta>('meta.json'),
  acknowledgments: (): AcknowledgmentEntry[] => readJson<AcknowledgmentEntry[]>('acknowledgments.json'),
  history: (): HistoryMilestone[] => readJson<HistoryMilestone[]>('history.json'),
}
