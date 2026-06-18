import { ref, type Ref } from 'vue'
import type { Project } from '../types/project'

const BUILD_TIME = Date.now()

const projects = ref<Project[]>([]) as Ref<Project[]>
const isLoaded = ref(false)
let loadPromise: Promise<void> | null = null

export function useProjects() {
  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/projects.json?t=${BUILD_TIME}`)
        projects.value = await response.json() as Project[]
        isLoaded.value = true
      } catch (e) {
        console.error('Failed to load projects', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setProjects = (data: Project[]) => {
    projects.value = data
    isLoaded.value = true
  }

  const all = () => projects.value
  const get = (id: string): Project | undefined => projects.value.find(p => p.id === id)

  return {
    projects,
    isLoaded,
    loadData,
    setProjects,
    all,
    get,
  }
}
