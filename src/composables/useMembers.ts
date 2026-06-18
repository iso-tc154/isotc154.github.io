import { ref, type Ref } from 'vue'
import type { MembersIndex, Member } from '../types/member'

const BUILD_TIME = Date.now()

const index = ref<MembersIndex | null>(null) as Ref<MembersIndex | null>
const isLoaded = ref(false)
let loadPromise: Promise<void> | null = null

export function useMembers() {
  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/members.json?t=${BUILD_TIME}`)
        index.value = await response.json() as MembersIndex
        isLoaded.value = true
      } catch (e) {
        console.error('Failed to load members', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setIndex = (data: MembersIndex) => {
    index.value = data
    isLoaded.value = true
  }

  const all = () => index.value?.all ?? {}
  const allList = () => Object.values(index.value?.all ?? {})
  const get = (id: string): Member | undefined => index.value?.all?.[id]
  const leadership = () => index.value?.leadership ?? []
  const current = () => index.value?.current ?? []
  const past = () => index.value?.past ?? []

  return {
    index,
    isLoaded,
    loadData,
    setIndex,
    all,
    allList,
    get,
    leadership,
    current,
    past,
  }
}
