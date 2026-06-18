import { ref, type Ref } from 'vue'
import type { PlenaryEvent } from '../types/event'

const BUILD_TIME = Date.now()

const events = ref<PlenaryEvent[]>([]) as Ref<PlenaryEvent[]>
const isLoaded = ref(false)
let loadPromise: Promise<void> | null = null

export function useEvents() {
  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/events.json?t=${BUILD_TIME}`)
        events.value = await response.json() as PlenaryEvent[]
        isLoaded.value = true
      } catch (e) {
        console.error('Failed to load events', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setEvents = (data: PlenaryEvent[]) => {
    events.value = data
    isLoaded.value = true
  }

  const all = () => events.value
  const upcoming = () => events.value.filter(e => e.status === 'upcoming')
  const past = () => events.value.filter(e => e.status !== 'upcoming')
  const get = (id: string): PlenaryEvent | undefined => events.value.find(e => e.id === id)

  return {
    events,
    isLoaded,
    loadData,
    setEvents,
    all,
    upcoming,
    past,
    get,
  }
}
