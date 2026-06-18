import { ref, type Ref } from 'vue'
import type { Meeting } from '../types/meeting'

const BUILD_TIME = Date.now()

const meetings = ref<Meeting[]>([]) as Ref<Meeting[]>
const isLoaded = ref(false)
let loadPromise: Promise<void> | null = null

export function useMeetings() {
  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/meetings.json?t=${BUILD_TIME}`)
        meetings.value = (await response.json()) as Meeting[]
        isLoaded.value = true
      } catch (e) {
        console.error('Failed to load meetings', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setMeetings = (data: Meeting[]) => {
    meetings.value = data
    isLoaded.value = true
  }

  const all = () => meetings.value
  const upcoming = () => meetings.value.filter(m => {
    if (!m.year) return false
    return m.status_label !== 'Concluded' && m.status_label !== 'Cancelled'
  })
  const past = () => meetings.value.filter(m => !upcoming().includes(m))
  const get = (ordinal: number | string): Meeting | undefined =>
    meetings.value.find(m => m.ordinal === Number(ordinal))

  return {
    meetings,
    isLoaded,
    loadData,
    setMeetings,
    all,
    upcoming,
    past,
    get,
  }
}
