import { computed, unref, type ComputedRef, type Ref } from 'vue'

type MaybeRef<T> = T | Ref<T> | ComputedRef<T>

export function createNeighborNav<T>(
  list: MaybeRef<T[]>,
  isCurrent: (item: T) => boolean,
): { prev: ComputedRef<T | null>; next: ComputedRef<T | null> } {
  const prev = computed<T | null>(() => {
    const arr = unref(list)
    const idx = arr.findIndex(isCurrent)
    if (idx <= 0) return null
    return arr[idx - 1]
  })

  const next = computed<T | null>(() => {
    const arr = unref(list)
    const idx = arr.findIndex(isCurrent)
    if (idx === -1 || idx >= arr.length - 1) return null
    return arr[idx + 1]
  })

  return { prev, next }
}
