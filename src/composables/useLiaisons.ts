import { createCollection } from './createCollection'
import type { Liaison } from '../types/organization'

const collection = createCollection<Liaison[]>({
  url: 'data/liaisons.json',
  initial: [],
})

export function useLiaisons() {
  const { items: liaisons, isLoaded, loadData } = collection

  const all = () => liaisons.value
  const get = (id: string): Liaison | undefined => liaisons.value.find(l => l.id === id)

  return { liaisons, isLoaded, loadData, all, get }
}
