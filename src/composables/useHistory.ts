import { createCollection } from './createCollection'
import type { HistoryMilestone } from '../types/history'

const c = createCollection<HistoryMilestone[]>({
  url: 'data/history.json',
  initial: [],
})

export function useHistory() {
  const { items: history, isLoaded, loadData } = c
  return { history, isLoaded, loadData }
}
