import { computed, watch } from 'vue'
import { useHead } from '@unhead/vue'
import { useRoute } from 'vue-router'
import { buildHeadObject, SITE_CONFIG } from '../utils/seo'
import { computeRouteMeta, entitiesNeededForRoute, type RouteMetaEntity } from '../utils/routeMeta'
import { useResolutions } from './useResolutions'
import { useMembers } from './useMembers'
import { useGroups } from './useGroups'
import { useStandards } from './useStandards'
import { useProjects } from './useProjects'
import { useLiaisons } from './useLiaisons'
import { useNationalBodies } from './useNationalBodies'
import { usePosts } from './usePosts'
import { usePages } from './usePages'
import { useMeetings } from './useMeetings'

export function useSeo() {
  const route = useRoute()
  const resolutionsStore = useResolutions()
  const membersStore = useMembers()
  const groups = useGroups()
  const standards = useStandards()
  const projects = useProjects()
  const liaisons = useLiaisons()
  const nationalBodies = useNationalBodies()
  const posts = usePosts()
  const pages = usePages()
  const meetings = useMeetings()

  const meta = computed(() =>
    computeRouteMeta(route.path, {
      resolutions: resolutionsStore.resolutions.value,
      members: { all: membersStore.index.value?.all ?? {} },
      groups: groups.all(),
      standards: standards.all(),
      projects: projects.all(),
      liaisons: liaisons.all(),
      nationalBodies: nationalBodies.all(),
      posts: posts.all(),
      pages: pages.all(),
      meetings: meetings.all(),
    }),
  )

  useHead(() => buildHeadObject(meta.value, SITE_CONFIG))

  if (!import.meta.env.SSR) {
    const loaders: Record<RouteMetaEntity, () => Promise<unknown>> = {
      resolutions: () => resolutionsStore.loadData(),
      members: () => membersStore.loadData(),
      groups: () => groups.loadData(),
      standards: () => standards.loadData(),
      projects: () => projects.loadData(),
      liaisons: () => liaisons.loadData(),
      nationalBodies: () => nationalBodies.loadData(),
      posts: () => posts.loadData(),
      pages: () => pages.loadData(),
      meetings: () => meetings.loadData(),
    }

    watch(
      () => route.path,
      (path) => {
        const kinds = entitiesNeededForRoute(path)
        if (kinds.length === 0) return
        Promise.all(kinds.map((k) => loaders[k]())).catch((e) =>
          console.error('SEO data load failed', e),
        )
      },
      { immediate: true },
    )
  }
}
