import { ref, type Ref } from 'vue'
import type { Standard } from '../types/standard'

const BUILD_TIME = Date.now()

const standards = ref<Standard[]>([]) as Ref<Standard[]>
const isLoaded = ref(false)
let loadPromise: Promise<void> | null = null

export function useStandards() {
  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/standards.json?t=${BUILD_TIME}`)
        standards.value = await response.json() as Standard[]
        isLoaded.value = true
      } catch (e) {
        console.error('Failed to load standards', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setStandards = (data: Standard[]) => {
    standards.value = data
    isLoaded.value = true
  }

  const all = () => standards.value
  const get = (id: string): Standard | undefined => standards.value.find(s => s.id === id)

  return {
    standards,
    isLoaded,
    loadData,
    setStandards,
    all,
    get,
  }
}
