import { createCollection } from './createCollection'
import type { PlenaryEvent } from '../types/event'

const collection = createCollection<PlenaryEvent[]>({
  url: 'data/events.json',
  initial: [],
})

export function useEvents() {
  const { items: events, isLoaded, loadData } = collection

  const all = () => events.value
  const upcoming = () => events.value.filter(e => e.status === 'upcoming')
  const past = () => events.value.filter(e => e.status !== 'upcoming')
  const get = (id: string): PlenaryEvent | undefined => events.value.find(e => e.id === id)

  return { events, isLoaded, loadData, all, upcoming, past, get }
}
