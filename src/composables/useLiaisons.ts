import { createListCollection } from './createCollection'
import type { Liaison } from '../types/organization'

const c = createListCollection<Liaison>({ url: 'data/liaisons.json', by: 'id' })

export function useLiaisons() {
  const { items: liaisons, isLoaded, loadData, all, get } = c
  return { liaisons, isLoaded, loadData, all, get }
}
