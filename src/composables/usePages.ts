import { createCollection } from './createCollection'
import type { PageDoc } from '../types/content'

const collection = createCollection<PageDoc[]>({
  url: 'data/pages.json',
  initial: [],
})

export function usePages() {
  const { items: pages, isLoaded, loadData } = collection

  const all = () => pages.value
  const get = (slug: string): PageDoc | undefined => pages.value.find(p => p.slug === slug)

  return { pages, isLoaded, loadData, all, get }
}
