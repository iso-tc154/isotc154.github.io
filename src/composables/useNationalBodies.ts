import { createCollection } from './createCollection'
import type { NationalBody } from '../types/organization'

const collection = createCollection<NationalBody[]>({
  url: 'data/national-bodies.json',
  initial: [],
})

export function useNationalBodies() {
  const { items: nationalBodies, isLoaded, loadData } = collection

  const all = () => nationalBodies.value
  const get = (id: string): NationalBody | undefined => nationalBodies.value.find(nb => nb.id === id)

  return { nationalBodies, isLoaded, loadData, all, get }
}
