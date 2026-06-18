import { createCollection } from './createCollection'
import type { HistoryMilestone } from '../types/history'

const collection = createCollection<HistoryMilestone[]>({
  url: 'data/history.json',
  initial: [],
})

export function useHistory() {
  const { items: history, isLoaded, loadData } = collection
  return { history, isLoaded, loadData }
}
