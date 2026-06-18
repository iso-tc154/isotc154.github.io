import { ref, type Ref } from 'vue'
import type { HistoryMilestone } from '../types/history'

const BUILD_TIME = Date.now()

const history = ref<HistoryMilestone[]>([]) as Ref<HistoryMilestone[]>
const isLoaded = ref(false)
let loadPromise: Promise<void> | null = null

export function useHistory() {
  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/history.json?t=${BUILD_TIME}`)
        history.value = await response.json() as HistoryMilestone[]
        isLoaded.value = true
      } catch (e) {
        console.error('Failed to load history', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setHistory = (data: HistoryMilestone[]) => {
    history.value = data
    isLoaded.value = true
  }

  return { history, isLoaded, loadData, setHistory }
}
