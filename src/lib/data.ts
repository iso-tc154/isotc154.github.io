import fs from 'node:fs'
import path from 'node:path'

const DATA_DIR = path.resolve('./public/data')

function readJson<T>(name: string): T {
  return JSON.parse(fs.readFileSync(path.join(DATA_DIR, name), 'utf-8')) as T
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
  id: string
  group?: string
  from?: { date: string; precision: 'day' | 'month' | 'year' }
  to?: { date: string; precision: 'day' | 'month' | 'year' } | null
}

export interface Member {
  'member-id': string
  name: string
  active: boolean
  deceased?: boolean
  affiliation?: string
  picture?: string
  bio?: string
  roles?: Record<string, { in: Record<string, RoleRecord[]> }>
  links?: { label: string; url: string }[]
  url?: string
  is_current?: boolean
  is_the_chair?: boolean
  is_in_leadership?: boolean
  [k: string]: unknown
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
  _id?: string
  name?: string
  title?: string
  category?: string
  order?: number
  intro?: string
  scope?: string
  active_projects?: unknown[]
  standards?: unknown[]
  members?: unknown[]
  past_members?: unknown[]
  convenors?: unknown[]
  co_chairs?: unknown[]
  managers?: unknown[]
  convenor_terms?: unknown[]
  history?: unknown[]
  url?: string
  _description?: string
}

export interface Project {
  id: string
  url: string
  name: string
  title: string
  status: string
  stage: string
  scope?: string
}

export interface Liaison {
  id: string
  url: string
  name: string
  short_name?: string
  category?: string
  logo?: string
  description?: string
}

export interface NationalBody {
  id: string
  url: string
  name: string
  short_name?: string
  iso_country_code?: string
  country?: string
  membership?: string
  logo?: string
  logo_light?: string
  logo_dark?: string
  description?: string
}

export interface Meeting {
  id: string
  url: string
  ordinal?: number
  general_area?: string
  from_date?: string | null
  to_date?: string | null
  [k: string]: unknown
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
  acknowledgments: (): unknown[] => readJson<unknown[]>('acknowledgments.json'),
  history: (): unknown[] => readJson<unknown[]>('history.json'),
}
