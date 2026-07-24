import { createListCollection } from './createCollection'
import type { PageDoc } from '../types/content'

const c = createListCollection<PageDoc>({ url: 'data/pages.json', by: 'slug' })

export function usePages() {
  const { items: pages, isLoaded, loadData, all, get } = c
  return { pages, isLoaded, loadData, all, get }
}
