import { createCollection } from './createCollection'
import type { MembersIndex, Member } from '../types/member'

const collection = createCollection<MembersIndex | null>({
  url: 'data/members.json',
  initial: null,
})

export function useMembers() {
  const { items: index, isLoaded, loadData } = collection

  const all = () => index.value?.all ?? {}
  const allList = () => Object.values(index.value?.all ?? {})
  const get = (id: string): Member | undefined => index.value?.all?.[id]
  const leadership = () => index.value?.leadership ?? []
  const current = () => index.value?.current ?? []
  const past = () => index.value?.past ?? []

  return { index, isLoaded, loadData, all, allList, get, leadership, current, past }
}
