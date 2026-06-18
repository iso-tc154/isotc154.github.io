import { ViteSSG } from 'vite-ssg'
import type { Resolution } from './types/resolution'
import type { MembersIndex } from './types/member'
import type { Group } from './types/group'
import type { Standard } from './types/standard'
import type { Project } from './types/project'
import type { Liaison, NationalBody } from './types/organization'
import type { PlenaryEvent } from './types/event'
import type { Post, PageDoc } from './types/content'
import type { Meeting } from './types/meeting'
import type { HistoryMilestone } from './types/history'
import App from './App.vue'
import { routes } from './router'
import './assets/main.css'

export const createApp = ViteSSG(
  App,
  {
    routes,
    base: import.meta.env.BASE_URL,
    scrollBehavior(to, _from, savedPosition) {
      if (savedPosition) return savedPosition
      if (to.hash) return { el: to.hash, behavior: 'smooth' }
      return { top: 0, left: 0 }
    },
  },
  async () => {
    if (import.meta.env.SSR) {
      const { readFileSync } = await import('node:fs')
      const { resolve } = await import('node:path')
      const { injectSsrData } = await import('./composables/createCollection')

      const dataDir = resolve(process.cwd(), 'public/data')
      const readJson = <T>(file: string): T =>
        JSON.parse(readFileSync(resolve(dataDir, file), 'utf-8'))

      injectSsrData('data/resolutions.json', readJson<Resolution[]>('resolutions.json'))
      injectSsrData('data/members.json', readJson<MembersIndex>('members.json'))
      injectSsrData('data/groups.json', readJson<Group[]>('groups.json'))
      injectSsrData('data/standards.json', readJson<Standard[]>('standards.json'))
      injectSsrData('data/projects.json', readJson<Project[]>('projects.json'))
      injectSsrData('data/liaisons.json', readJson<Liaison[]>('liaisons.json'))
      injectSsrData('data/national-bodies.json', readJson<NationalBody[]>('national-bodies.json'))
      injectSsrData('data/events.json', readJson<PlenaryEvent[]>('events.json'))
      injectSsrData('data/posts.json', readJson<Post[]>('posts.json'))
      injectSsrData('data/pages.json', readJson<PageDoc[]>('pages.json'))
      injectSsrData('data/meetings.json', readJson<Meeting[]>('meetings.json'))
      injectSsrData('data/history.json', readJson<HistoryMilestone[]>('history.json'))

      const { useResolutions } = await import('./composables/useResolutions')
      const { useMembers } = await import('./composables/useMembers')
      const { useGroups } = await import('./composables/useGroups')
      const { useStandards } = await import('./composables/useStandards')
      const { useProjects } = await import('./composables/useProjects')
      const { useLiaisons } = await import('./composables/useLiaisons')
      const { useNationalBodies } = await import('./composables/useNationalBodies')
      const { useEvents } = await import('./composables/useEvents')
      const { usePosts } = await import('./composables/usePosts')
      const { usePages } = await import('./composables/usePages')
      const { useMeetings } = await import('./composables/useMeetings')
      const { useHistory } = await import('./composables/useHistory')

      await Promise.all([
        useResolutions().loadData(),
        useMembers().loadData(),
        useGroups().loadData(),
        useStandards().loadData(),
        useProjects().loadData(),
        useLiaisons().loadData(),
        useNationalBodies().loadData(),
        useEvents().loadData(),
        usePosts().loadData(),
        usePages().loadData(),
        useMeetings().loadData(),
        useHistory().loadData(),
      ])
    } else {
      const pageData = (window as any).__PAGE_DATA__
      if (pageData) {
        const { useResolutions } = await import('./composables/useResolutions')
        const { setPageData } = useResolutions()
        setPageData(pageData as Resolution[])
      }
    }
  },
)
