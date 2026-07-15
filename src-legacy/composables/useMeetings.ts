import { createCollection } from './createCollection'
import type { Meeting } from '../types/meeting'

const collection = createCollection<Meeting[]>({
  url: 'data/meetings.json',
  initial: [],
})

export function useMeetings() {
  const { items: meetings, isLoaded, loadData } = collection

  const all = () => meetings.value
  const upcoming = () => meetings.value.filter(m => {
    if (!m.year) return false
    return m.status_label !== 'Concluded' && m.status_label !== 'Cancelled'
  })
  const past = () => meetings.value.filter(m => !upcoming().includes(m))
  const get = (ordinal: number | string): Meeting | undefined =>
    meetings.value.find(m => m.ordinal === Number(ordinal))

  return { meetings, isLoaded, loadData, all, upcoming, past, get }
}
