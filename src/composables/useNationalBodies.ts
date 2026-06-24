import { createListCollection } from './createCollection'
import type { NationalBody } from '../types/organization'

const c = createListCollection<NationalBody>({ url: 'data/national-bodies.json', by: 'id' })

export function useNationalBodies() {
  const { items: nationalBodies, isLoaded, loadData, all, get } = c
  return { nationalBodies, isLoaded, loadData, all, get }
}
