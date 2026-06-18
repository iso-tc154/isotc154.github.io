import { ref, type Ref } from 'vue'
import type { Group } from '../types/group'

const BUILD_TIME = Date.now()

const groups = ref<Group[]>([]) as Ref<Group[]>
const isLoaded = ref(false)
let loadPromise: Promise<void> | null = null

export function useGroups() {
  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/groups.json?t=${BUILD_TIME}`)
        groups.value = await response.json() as Group[]
        isLoaded.value = true
      } catch (e) {
        console.error('Failed to load groups', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setGroups = (data: Group[]) => {
    groups.value = data
    isLoaded.value = true
  }

  const all = () => groups.value
  const get = (id: string): Group | undefined => groups.value.find(g => g.id === id || g._id === id)

  return {
    groups,
    isLoaded,
    loadData,
    setGroups,
    all,
    get,
  }
}
