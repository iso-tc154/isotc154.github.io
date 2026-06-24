import { createListCollection } from './createCollection'
import type { PlenaryEvent } from '../types/event'

const c = createListCollection<PlenaryEvent>({ url: 'data/events.json', by: 'id' })

export function useEvents() {
  const { items: events, isLoaded, loadData, all, get } = c
  const upcoming = () => events.value.filter(e => e.status === 'upcoming')
  const past = () => events.value.filter(e => e.status !== 'upcoming')
  return { events, isLoaded, loadData, all, upcoming, past, get }
}
