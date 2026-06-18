import { ref, type Ref } from 'vue'

const BUILD_TIME = Date.now()

const ssrRegistry = new Map<string, unknown>()

export function injectSsrData(key: string, data: unknown): void {
  ssrRegistry.set(key, data)
}

export interface Collection<T> {
  items: Ref<T>
  isLoaded: Ref<boolean>
  loadData: () => Promise<void>
}

export function createCollection<T>(opts: {
  url: string
  key?: string
  initial: T
  onLoad?: (data: T) => void
}): Collection<T> {
  const { url, key = url, initial, onLoad } = opts

  const items = ref(initial) as Ref<T>
  const isLoaded = ref(false)
  let loadPromise: Promise<void> | null = null

  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    if (ssrRegistry.has(key)) {
      const data = ssrRegistry.get(key) as T
      items.value = data
      onLoad?.(data)
      isLoaded.value = true
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}${url}?t=${BUILD_TIME}`)
        const data = (await response.json()) as T
        items.value = data
        onLoad?.(data)
        isLoaded.value = true
      } catch (e) {
        console.error(`Failed to load ${url}`, e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  return { items, isLoaded, loadData }
}
