import { createCollection } from './createCollection'
import type { Post } from '../types/content'

const collection = createCollection<Post[]>({
  url: 'data/posts.json',
  initial: [],
})

export function usePosts() {
  const { items: posts, isLoaded, loadData } = collection

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

  return { posts, isLoaded, loadData, all, get, byYear }
}
