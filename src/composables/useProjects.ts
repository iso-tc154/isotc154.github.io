import { createCollection } from './createCollection'
import type { Project } from '../types/project'

const collection = createCollection<Project[]>({
  url: 'data/projects.json',
  initial: [],
})

export function useProjects() {
  const { items: projects, isLoaded, loadData } = collection

  const all = () => projects.value
  const get = (id: string): Project | undefined => projects.value.find(p => p.id === id)

  return { projects, isLoaded, loadData, all, get }
}
