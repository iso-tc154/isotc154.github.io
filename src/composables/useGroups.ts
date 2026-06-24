import { createListCollection } from './createCollection'
import type { Group } from '../types/group'

const c = createListCollection<Group>({ url: 'data/groups.json', by: ['id', '_id'] })

export function useGroups() {
  const { items: groups, isLoaded, loadData, all, get } = c
  return { groups, isLoaded, loadData, all, get }
}
