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

export interface MemberSummary {
  'member-id': string
  name: string
  active: boolean
  deceased?: boolean
  affiliation?: string
  picture?: string
  roles?: unknown[]
  [k: string]: unknown
}

export interface StandardSummary {
  id: string
  slug?: string
  url: string
  iso?: {
    name: string
    type?: string
    title?: string
    stage?: string
    publication_date?: string | null
    ics?: string
    store_id?: number | null
    scope?: string
  }
  tc154?: {
    status?: string
    group?: string
    introduction?: string
    scope?: string
    [k: string]: unknown
  }
  [k: string]: unknown
}

export interface GroupSummary {
  id: string
  url: string
  name?: string
  type?: string
  status?: string
  scope?: string
  [k: string]: unknown
}

export interface ProjectSummary {
  id: string
  url: string
  reference?: string
  title?: string
  stage?: string
  [k: string]: unknown
}

export interface LiaisonSummary {
  id: string
  url: string
  name?: string
  acronym?: string
  type?: string
  country?: string
  [k: string]: unknown
}

export interface NationalBodySummary {
  id: string
  url: string
  name?: string
  iso_code?: string
  participation?: string
  [k: string]: unknown
}

export interface MeetingSummary {
  id: string
  url: string
  ordinal?: number
  general_area?: string
  from_date?: string | null
  to_date?: string | null
  [k: string]: unknown
}

export interface PostSummary {
  slug: string
  url: string
  title?: string
  date?: string
  excerpt?: string
  author?: string
  tags?: string[]
  [k: string]: unknown
}

export interface SiteMeta {
  generatedAt: string
  counts: Record<string, number> & {
    groups: number
    activeGroups: number
    activeWorkingGroups: number
    members: number
    standards: number
    publishedStandards: number
    withdrawnStandards: number
    underDevelopmentStandards: number
    projects: number
    events: number
    liaisons: number
    nationalBodies: number
    participatingMembers: number
    observingMembers: number
    totalMembers: number
    associates: number
    resolutions: number
    meetings: number
    posts: number
    pages: number
    acknowledgments: number
    history: number
  }
  current: {
    latestPublication: {
      id: string
      url: string
      name: string
      title: string
      publication_date: string | null
    } | null
    latestResolution: {
      id: string
      url: string
      title: string
      meeting_date: string | null
      source_title: string
    } | null
    openForComment: {
      id: string
      url: string
      name: string
      title: string
      stage: string
      store_id?: number | null
    }[]
    nextPlenary: {
      id: string
      url: string
      ordinal: number
      general_area: string
      from_date: string | null
      to_date: string | null
      registration_url?: string | null
    } | null
  }
}

export const loadData = {
  pages: (): PageDoc[] => readJson<PageDoc[]>('pages.json'),
  page: (url: string): PageDoc | undefined =>
    loadData.pages().find((p) => p.url === url || p.frontmatter.permalink === url),
  members: (): MemberSummary[] => readJson<MemberSummary[]>('members.json'),
  standards: (): StandardSummary[] => readJson<StandardSummary[]>('standards.json'),
  groups: (): GroupSummary[] => readJson<GroupSummary[]>('groups.json'),
  projects: (): ProjectSummary[] => readJson<ProjectSummary[]>('projects.json'),
  liaisons: (): LiaisonSummary[] => readJson<LiaisonSummary[]>('liaisons.json'),
  nationalBodies: (): NationalBodySummary[] => readJson<NationalBodySummary[]>('national-bodies.json'),
  meetings: (): MeetingSummary[] => readJson<MeetingSummary[]>('meetings.json'),
  posts: (): PostSummary[] => readJson<PostSummary[]>('posts.json'),
  meta: (): SiteMeta => readJson<SiteMeta>('meta.json'),
  acknowledgments: (): unknown[] => readJson<unknown[]>('acknowledgments.json'),
  history: (): unknown[] => readJson<unknown[]>('history.json'),
}
