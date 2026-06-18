import { createCollection } from './createCollection'
import type { Standard } from '../types/standard'

const collection = createCollection<Standard[]>({
  url: 'data/standards.json',
  initial: [],
})

export function useStandards() {
  const { items: standards, isLoaded, loadData } = collection

  const all = () => standards.value
  const get = (id: string): Standard | undefined => standards.value.find(s => s.id === id)

  return { standards, isLoaded, loadData, all, get }
}
