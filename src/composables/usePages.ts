import { ref, type Ref } from 'vue'
import type { PageDoc } from '../types/content'

const BUILD_TIME = Date.now()

const pages = ref<PageDoc[]>([]) as Ref<PageDoc[]>
const isLoaded = ref(false)
let loadPromise: Promise<void> | null = null

export function usePages() {
  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/pages.json?t=${BUILD_TIME}`)
        pages.value = await response.json() as PageDoc[]
        isLoaded.value = true
      } catch (e) {
        console.error('Failed to load pages', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setPages = (data: PageDoc[]) => {
    pages.value = data
    isLoaded.value = true
  }

  const all = () => pages.value
  const get = (slug: string): PageDoc | undefined => pages.value.find(p => p.slug === slug)

  return {
    pages,
    isLoaded,
    loadData,
    setPages,
    all,
    get,
  }
}
