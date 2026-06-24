import { createListCollection } from './createCollection'
import type { Standard } from '../types/standard'

const c = createListCollection<Standard>({ url: 'data/standards.json', by: 'id' })

export function useStandards() {
  const { items: standards, isLoaded, loadData, all, get } = c
  return { standards, isLoaded, loadData, all, get }
}
