import { ref, type Ref } from 'vue'
import type { Post } from '../types/content'

const BUILD_TIME = Date.now()

const posts = ref<Post[]>([]) as Ref<Post[]>
const isLoaded = ref(false)
let loadPromise: Promise<void> | null = null

export function usePosts() {
  const loadData = async () => {
    if (isLoaded.value) return
    if (loadPromise) {
      await loadPromise
      return
    }

    loadPromise = (async () => {
      try {
        const response = await fetch(`${import.meta.env.BASE_URL}data/posts.json?t=${BUILD_TIME}`)
        posts.value = await response.json() as Post[]
        isLoaded.value = true
      } catch (e) {
        console.error('Failed to load posts', e)
        loadPromise = null
      }
    })()

    await loadPromise
  }

  const setPosts = (data: Post[]) => {
    posts.value = data
    isLoaded.value = true
  }

  const all = () => posts.value
  const get = (slug: string): Post | undefined => posts.value.find(p => p.slug === slug)
  const byYear = () => {
    const map = new Map<string, Post[]>()
    for (const p of posts.value) {
      const year = (p.date || '').slice(0, 4)
      if (!map.has(year)) map.set(year, [])
      map.get(year)!.push(p)
    }
    return Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
  }

  return {
    posts,
    isLoaded,
    loadData,
    setPosts,
    all,
    get,
    byYear,
  }
}
