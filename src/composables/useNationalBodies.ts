import { ref, type Ref } from 'vue'
import type { NationalBody } from '../types/organization'

const BUILD_TIME = Date.now()

const nationalBodies = ref<NationalBody[]>([]) as Ref<NationalBody[]>
const isLoaded = ref(false)
let loadPromise: Promise<void> | null = null

export function useNationalBodies() {
  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/national-bodies.json?t=${BUILD_TIME}`)
        nationalBodies.value = await response.json() as NationalBody[]
        isLoaded.value = true
      } catch (e) {
        console.error('Failed to load national bodies', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setNationalBodies = (data: NationalBody[]) => {
    nationalBodies.value = data
    isLoaded.value = true
  }

  const all = () => nationalBodies.value
  const get = (id: string): NationalBody | undefined => nationalBodies.value.find(nb => nb.id === id)

  return {
    nationalBodies,
    isLoaded,
    loadData,
    setNationalBodies,
    all,
    get,
  }
}
