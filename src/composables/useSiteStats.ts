import { ref, type Ref } from 'vue'

export interface MetaLatestPublication {
  id: string
  url: string
  name: string
  title: string
  publication_date: string | null
}

export interface MetaLatestResolution {
  id: string
  url: string
  title: string
  meeting_date: string | null
  source_title: string
}

export interface MetaOpenForComment {
  id: string
  url: string
  name: string
  title: string
  stage: string
  store_id?: number | null
}

export interface MetaNextPlenary {
  id: string
  url: string
  ordinal: number
  general_area: string
  from_date: string | null
  to_date: string | null
  registration_url?: string | null
}

export interface MetaCounts {
  groups: number
  activeGroups: number
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

export interface SiteMeta {
  generatedAt: string
  counts: MetaCounts
  current: {
    latestPublication: MetaLatestPublication | null
    latestResolution: MetaLatestResolution | null
    openForComment: MetaOpenForComment[]
    nextPlenary: MetaNextPlenary | null
  }
}

const siteStats: Ref<SiteMeta | null> = ref(null)
let loadPromise: Promise<SiteMeta | null> | null = null

export function useSiteStats(): { siteStats: Ref<SiteMeta | null>; load: () => Promise<SiteMeta | null> } {
  const load = async (): Promise<SiteMeta | null> => {
    if (siteStats.value) return siteStats.value
    if (loadPromise) return loadPromise

    loadPromise = (async () => {
      try {
        const res = await fetch(`${import.meta.env.BASE_URL}data/meta.json`)
        const data = (await res.json()) as SiteMeta
        siteStats.value = data
        return data
      } catch (e) {
        console.error('Failed to load meta.json', e)
        return null
      }
    })()

    return loadPromise
  }

  return { siteStats, load }
}
