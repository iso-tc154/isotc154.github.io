import { ref, type Ref } from 'vue'
import type { Liaison } from '../types/organization'

const BUILD_TIME = Date.now()

const liaisons = ref<Liaison[]>([]) as Ref<Liaison[]>
const isLoaded = ref(false)
let loadPromise: Promise<void> | null = null

export function useLiaisons() {
  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/liaisons.json?t=${BUILD_TIME}`)
        liaisons.value = await response.json() as Liaison[]
        isLoaded.value = true
      } catch (e) {
        console.error('Failed to load liaisons', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setLiaisons = (data: Liaison[]) => {
    liaisons.value = data
    isLoaded.value = true
  }

  const all = () => liaisons.value
  const get = (id: string): Liaison | undefined => liaisons.value.find(l => l.id === id)

  return {
    liaisons,
    isLoaded,
    loadData,
    setLiaisons,
    all,
    get,
  }
}
