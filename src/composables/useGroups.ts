import { createCollection } from './createCollection'
import type { Group } from '../types/group'

const collection = createCollection<Group[]>({
  url: 'data/groups.json',
  initial: [],
})

export function useGroups() {
  const { items: groups, isLoaded, loadData } = collection

  const all = () => groups.value
  const get = (id: string): Group | undefined => groups.value.find(g => g.id === id || g._id === id)

  return { groups, isLoaded, loadData, all, get }
}
