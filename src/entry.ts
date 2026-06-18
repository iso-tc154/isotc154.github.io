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
  { routes, base: import.meta.env.BASE_URL },
  async () => {
    if (import.meta.env.SSR) {
      const { readFileSync } = await import('node:fs')
      const { resolve } = await import('node:path')
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

      const dataDir = resolve(process.cwd(), 'public/data')

      const resolutionsData: Resolution[] = JSON.parse(readFileSync(resolve(dataDir, 'resolutions.json'), 'utf-8'))
      const { resolutions, isLoaded: resLoaded } = useResolutions()
      resolutions.value = resolutionsData
      resLoaded.value = true

      const membersData: MembersIndex = JSON.parse(readFileSync(resolve(dataDir, 'members.json'), 'utf-8'))
      useMembers().setIndex(membersData)

      const groupsData: Group[] = JSON.parse(readFileSync(resolve(dataDir, 'groups.json'), 'utf-8'))
      useGroups().setGroups(groupsData)

      const standardsData: Standard[] = JSON.parse(readFileSync(resolve(dataDir, 'standards.json'), 'utf-8'))
      useStandards().setStandards(standardsData)

      const projectsData: Project[] = JSON.parse(readFileSync(resolve(dataDir, 'projects.json'), 'utf-8'))
      useProjects().setProjects(projectsData)

      const liaisonsData: Liaison[] = JSON.parse(readFileSync(resolve(dataDir, 'liaisons.json'), 'utf-8'))
      useLiaisons().setLiaisons(liaisonsData)

      const nationalBodiesData: NationalBody[] = JSON.parse(readFileSync(resolve(dataDir, 'national-bodies.json'), 'utf-8'))
      useNationalBodies().setNationalBodies(nationalBodiesData)

      const eventsData: PlenaryEvent[] = JSON.parse(readFileSync(resolve(dataDir, 'events.json'), 'utf-8'))
      useEvents().setEvents(eventsData)

      const postsData: Post[] = JSON.parse(readFileSync(resolve(dataDir, 'posts.json'), 'utf-8'))
      usePosts().setPosts(postsData)

      const pagesData: PageDoc[] = JSON.parse(readFileSync(resolve(dataDir, 'pages.json'), 'utf-8'))
      usePages().setPages(pagesData)

      const meetingsData: Meeting[] = JSON.parse(readFileSync(resolve(dataDir, 'meetings.json'), 'utf-8'))
      useMeetings().setMeetings(meetingsData)

      const historyData: HistoryMilestone[] = JSON.parse(readFileSync(resolve(dataDir, 'history.json'), 'utf-8'))
      useHistory().setHistory(historyData)
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
